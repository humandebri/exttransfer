"use client";

// components/ext-transfer/use-ext-tokens.tsx: Fetch tokens_ext data for the connected account.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccounts, useAgent } from "@nfid/identitykit/react";

import { useCanisters } from "@/components/ext-transfer/canister-store";
import { deriveAccountId } from "@/lib/ic-account";
import { IC_HOST } from "@/lib/runtime-config";
import { fetchTokensExt } from "@/lib/ext-tokens";

export type DisplayToken = {
  id: string;
  label: string;
  collection: string;
  tokenId: string;
  tone: string;
  rarity: string;
};

type TokensState = {
  tokens: DisplayToken[];
  loading: boolean;
  error: string | null;
};

const TOKEN_TONES = [
  "from-amber-200/80 via-orange-100 to-rose-100",
  "from-emerald-200/70 via-lime-100 to-stone-100",
  "from-sky-200/70 via-cyan-100 to-slate-100",
  "from-stone-200/80 via-zinc-100 to-amber-100",
  "from-rose-200/70 via-orange-100 to-neutral-100",
  "from-slate-200/70 via-zinc-100 to-stone-100",
];

const RARITY_LABELS = ["Core", "Rare", "Ultra", "Legend"];

export function useExtTokens() {
  const { canisters } = useCanisters();
  const agent = useAgent({ host: IC_HOST });
  const accounts = useAccounts();

  const accountId = useMemo(() => {
    if (!accounts || accounts.length === 0) {
      return null;
    }
    return deriveAccountId(accounts[0].principal, accounts[0].subAccount);
  }, [accounts]);

  const [state, setState] = useState<TokensState>({
    tokens: [],
    loading: false,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!agent || !accountId) {
      return;
    }
    setState({ tokens: [], loading: true, error: null });
    try {
      const tokens: DisplayToken[] = [];
      for (const [index, canister] of canisters.entries()) {
        const result = await fetchTokensExt(agent, canister.id, accountId);
        if (result.kind === "tokenIdentifiers") {
          result.tokens.forEach((token, tokenIndex) => {
            tokens.push({
              id: token,
              label: token,
              collection: canister.name,
              tokenId: token,
              tone: TOKEN_TONES[(tokenIndex + index) % TOKEN_TONES.length],
              rarity: RARITY_LABELS[(tokenIndex + index) % RARITY_LABELS.length],
            });
          });
        }
        if (result.kind === "indexes") {
          result.indexes.forEach((tokenIndex) => {
            const tokenText = tokenIndex.toString();
            tokens.push({
              id: `${canister.id}-${tokenText}`,
              label: `#${tokenText}`,
              collection: canister.name,
              tokenId: tokenText,
              tone: TOKEN_TONES[(Number(tokenIndex % 6n)) % TOKEN_TONES.length],
              rarity: RARITY_LABELS[Number(tokenIndex % 4n)],
            });
          });
        }
      }
      setState({ tokens, loading: false, error: null });
    } catch {
      setState({ tokens: [], loading: false, error: "Failed to load tokens." });
    }
  }, [agent, accountId, canisters]);

  useEffect(() => {
    if (!agent || !accountId) {
      return;
    }
    refresh();
  }, [agent, accountId, canisters, refresh]);

  return {
    tokens: state.tokens,
    loading: state.loading,
    error: state.error,
    refresh,
    accountId,
  };
}
