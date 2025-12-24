"use client";

// components/ext-transfer/use-ext-token-counts.tsx: サイドバー用に全Canisterの所持数を自動取得するためのフック。
import { useEffect, useMemo, useState } from "react";
import { HttpAgent } from "@dfinity/agent";

import { useCanisters } from "@/components/ext-transfer/canister-store";
import { useWalletMeta } from "@/components/ext-transfer/use-wallet-meta";
import { fetchOwnedTokenIndexes } from "@/lib/ext-owned-tokens";
import { IC_HOST, TOKEN_COUNT_CONCURRENCY } from "@/lib/runtime-config";

export type TokenCountEntry = {
  status: "idle" | "loading" | "ok" | "err";
  count: number | null;
  error: string | null;
};

type TokenCountMap = Record<string, TokenCountEntry>;

type FetchResult = {
  canisterId: string;
  entry: TokenCountEntry;
};

export function useExtTokenCounts() {
  const { canisters } = useCanisters();
  const { accountId } = useWalletMeta();
  const hasAccount = accountId !== "Not connected";
  const agent = useMemo(() => new HttpAgent({ host: IC_HOST }), []);

  const [counts, setCounts] = useState<TokenCountMap>({});

  useEffect(() => {
    let cancelled = false;
    if (!hasAccount) {
      setCounts(buildIdleState(canisters));
      return;
    }

    setCounts((prev) => buildLoadingState(canisters, prev));

    const loadCounts = async () => {
      const results = await runWithConcurrency(
        canisters,
        TOKEN_COUNT_CONCURRENCY,
        async (canister) => {
          const result = await fetchOwnedTokenIndexes(
            agent,
            canister.id,
            accountId
          );
          if (result.kind === "ok") {
            const entry: TokenCountEntry = {
              status: "ok",
              count: result.indexes.length,
              error: null,
            };
            return {
              canisterId: canister.id,
              entry,
            };
          }
          const entry: TokenCountEntry = {
            status: "err",
            count: null,
            error: result.message,
          };
          return {
            canisterId: canister.id,
            entry,
          };
        }
      );

      if (cancelled) {
        return;
      }

      setCounts((prev) => {
        const next: TokenCountMap = {
          ...prev,
        };
        for (const result of results) {
          next[result.canisterId] = result.entry;
        }
        // 既に削除されたCanisterは表示しない。
        for (const key of Object.keys(next)) {
          if (!canisters.some((canister) => canister.id === key)) {
            delete next[key];
          }
        }
        return next;
      });
    };

    loadCounts();

    return () => {
      cancelled = true;
    };
  }, [accountId, agent, canisters, hasAccount]);

  return {
    counts,
    hasAccount,
  };
}

function buildIdleState(canisters: { id: string }[]): TokenCountMap {
  const next: TokenCountMap = {};
  for (const canister of canisters) {
    next[canister.id] = {
      status: "idle",
      count: null,
      error: null,
    };
  }
  return next;
}

function buildLoadingState(
  canisters: { id: string }[],
  prev: TokenCountMap
): TokenCountMap {
  const next: TokenCountMap = {};
  for (const canister of canisters) {
    const previous = prev[canister.id];
    next[canister.id] = {
      status: "loading",
      count: previous?.status === "ok" ? previous.count : null,
      error: null,
    };
  }
  return next;
}

async function runWithConcurrency<Item, Result>(
  items: Item[],
  limit: number,
  handler: (item: Item) => Promise<Result>
): Promise<Result[]> {
  if (items.length === 0) {
    return [];
  }

  const results: Result[] = new Array(items.length);
  let index = 0;
  const workerCount = Math.min(Math.max(limit, 1), items.length);

  const workers = Array.from({ length: workerCount }, async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      const item = items[currentIndex];
      const result = await handler(item);
      results[currentIndex] = result;
    }
  });

  await Promise.all(workers);
  return results;
}
