"use client";

// components/ext-transfer/use-ext-tokens.tsx: Fetch getRegistry data for the selected canister.
import { useCallback, useEffect, useMemo, useState } from "react";
import { HttpAgent } from "@dfinity/agent";

import { useCanisters } from "@/components/ext-transfer/canister-store";
import { IC_HOST } from "@/lib/runtime-config";
import { fetchRegistry } from "@/lib/ext-registry";
import { tokenIdentifierFromIndex } from "@/lib/ext-token-id";
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
      const registry = await fetchRegistry(agent, selectedCanister.id);
      const filtered = registry.filter((entry) => entry.accountId === accountId);
      filtered.sort((a, b) => a.tokenIndex - b.tokenIndex);
      console.info("[exttransfer] sorted token indexes", {
        count: filtered.length,
        first: filtered[0]?.tokenIndex ?? null,
        last: filtered[filtered.length - 1]?.tokenIndex ?? null,
      });
      console.info("[exttransfer] token identifiers", {
        pairs: filtered.map((entry) => ({
          tokenIndex: entry.tokenIndex,
          tokenIdentifier: tokenIdentifierFromIndex(
            selectedCanister.id,
            entry.tokenIndex
          ),
        })),
      });
      const tokens: DisplayToken[] = filtered
        .map((entry, entryIndex) => {
          const tokenIdentifier = tokenIdentifierFromIndex(
            selectedCanister.id,
            entry.tokenIndex
          );
          const tokenText = tokenIdentifier;
          return {
            id: `${selectedCanister.id}-${tokenText}`,
            label: `#${entry.tokenIndex + 1}`,
            collection: selectedCanister.name,
            tokenId: `#${entry.tokenIndex + 1}`,
            tone: TOKEN_TONES[entryIndex % TOKEN_TONES.length],
            rarity: RARITY_LABELS[entryIndex % RARITY_LABELS.length],
            imageUrl: `https://${selectedCanister.id}.raw.icp0.io/?cc=0&type=thumbnail&tokenid=${encodeURIComponent(
              tokenText
            )}`,
            tokenIdentifier: tokenText,
          };
        });
      setState({ tokens, loading: false, error: null });
    } catch {
      setState({ tokens: [], loading: false, error: "Failed to load tokens." });
    }
  }, [agent, hasAccount, selectedCanister]);

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
