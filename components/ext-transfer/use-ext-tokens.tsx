"use client";

// components/ext-transfer/use-ext-tokens.tsx: Fetch getRegistry data for the selected canister.
import { useCallback, useEffect, useMemo, useState } from "react";
import { HttpAgent } from "@dfinity/agent";

import { useCanisters } from "@/components/ext-transfer/canister-store";
import { PINEAPPLE_PUNKS_CANISTER_ID } from "@/components/ext-transfer/transfer-data";
import { IC_HOST } from "@/lib/runtime-config";
import { tokenIdentifierFromIndex } from "@/lib/ext-token-id";
import { fetchOwnedTokenIndexes } from "@/lib/ext-owned-tokens";
import { useWalletMeta } from "@/components/ext-transfer/use-wallet-meta";

export type DisplayToken = {
  id: string;
  label: string;
  collection: string;
  tokenId: string;
  tone: string;
  rarity: string;
  imageUrl?: string;
  tokenIdentifier: string;
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
  const { selectedCanister } = useCanisters();
  const agent = useMemo(() => new HttpAgent({ host: IC_HOST }), []);
  const { accountId } = useWalletMeta();
  const hasAccount = accountId !== "Not connected";

  const [state, setState] = useState<TokensState>({
    tokens: [],
    loading: false,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!agent || !hasAccount || !selectedCanister) {
      setState({ tokens: [], loading: false, error: null });
      return;
    }
    setState({ tokens: [], loading: true, error: null });
    try {
      const result = await fetchOwnedTokenIndexes(
        agent,
        selectedCanister.id,
        accountId
      );
      if (result.kind === "err") {
        setState({ tokens: [], loading: false, error: result.message });
        return;
      }
      const indexes = [...result.indexes].sort((a, b) => a - b);
      console.info("[exttransfer] sorted token indexes", {
        count: indexes.length,
        first: indexes[0] ?? null,
        last: indexes[indexes.length - 1] ?? null,
      });
      console.info("[exttransfer] token identifiers", {
        pairs: indexes.map((tokenIndex) => ({
          tokenIndex,
          tokenIdentifier: tokenIdentifierFromIndex(selectedCanister.id, tokenIndex),
        })),
      });
      const tokens: DisplayToken[] = indexes.map((tokenIndex, entryIndex) => {
          const tokenIdentifier = tokenIdentifierFromIndex(
            selectedCanister.id,
            tokenIndex
          );
          const tokenText = tokenIdentifier;
          const imageUrl =
            selectedCanister.id === PINEAPPLE_PUNKS_CANISTER_ID
              ? `https://images.entrepot.app/tnc/wtwf2-biaaa-aaaam-qauoq-cai/${encodeURIComponent(
                  tokenText
                )}`
              : `https://${selectedCanister.id}.raw.icp0.io/?cc=0&type=thumbnail&tokenid=${encodeURIComponent(
                  tokenText
                )}`;
          return {
            id: `${selectedCanister.id}-${tokenIndex}-${entryIndex}`,
            label: `#${tokenIndex + 1}`,
            collection: selectedCanister.name,
            tokenId: `#${tokenIndex + 1}`,
            tone: TOKEN_TONES[entryIndex % TOKEN_TONES.length],
            rarity: RARITY_LABELS[entryIndex % RARITY_LABELS.length],
            imageUrl,
            tokenIdentifier: tokenText,
          };
        });
      setState({ tokens, loading: false, error: null });
    } catch {
      setState({ tokens: [], loading: false, error: "Failed to load tokens." });
    }
  }, [agent, hasAccount, selectedCanister, accountId]);

  useEffect(() => {
    if (!agent || !hasAccount || !selectedCanister) {
      return;
    }
    refresh();
  }, [agent, hasAccount, selectedCanister, refresh]);

  return {
    tokens: state.tokens,
    loading: state.loading,
    error: state.error,
    refresh,
    accountId,
  };
}
