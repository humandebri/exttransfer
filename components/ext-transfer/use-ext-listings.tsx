"use client";

// components/ext-transfer/use-ext-listings.tsx: 選択中Canisterのlistingsを取得し価格情報を整理する。
import { useEffect, useMemo, useState } from "react";
import { HttpAgent } from "@dfinity/agent";

import { useCanisters } from "@/components/ext-transfer/canister-store";
import { IC_HOST } from "@/lib/runtime-config";
import { fetchListings, type ListingInfo } from "@/lib/ext-listings";

export type ListingDisplay = {
  priceLabel: string;
  sellerFrontend: string | null;
};

type ListingsState = {
  listingsByIndex: Record<number, ListingDisplay>;
  loading: boolean;
  error: string | null;
};

export function useExtListings() {
  const { selectedCanister } = useCanisters();
  const agent = useMemo(() => new HttpAgent({ host: IC_HOST }), []);

  const [state, setState] = useState<ListingsState>({
    listingsByIndex: {},
    loading: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    if (!selectedCanister) {
      setState({ listingsByIndex: {}, loading: false, error: null });
      return;
    }

    setState((prev) => ({
      ...prev,
      listingsByIndex: {},
      loading: true,
      error: null,
    }));

    const run = async () => {
      const result = await fetchListings(agent, selectedCanister.id);
      if (cancelled) {
        return;
      }
      if (result.kind === "err") {
        setState({ listingsByIndex: {}, loading: false, error: result.message });
        return;
      }
      const listingsByIndex = buildListingDisplayMap(result.listings);
      setState({ listingsByIndex, loading: false, error: null });
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [agent, selectedCanister]);

  return state;
}

function buildListingDisplayMap(
  listings: ListingInfo[]
): Record<number, ListingDisplay> {
  const map: Record<number, ListingDisplay> = {};
  for (const listing of listings) {
    map[listing.tokenIndex] = {
      priceLabel: formatListingPrice(listing),
      sellerFrontend: listing.sellerFrontend,
    };
  }
  return map;
}

function formatListingPrice(listing: ListingInfo): string {
  const decimals = 8;
  if (!listing.currency) {
    return formatAmount(listing.price, decimals);
  }
  const value = formatAmount(listing.price, decimals);
  return `${value} ${listing.currency.symbol}`;
}

function formatAmount(value: bigint, decimals: number): string {
  if (decimals <= 0) {
    return value.toString();
  }
  const base = BigInt(10) ** BigInt(decimals);
  const integer = value / base;
  const fraction = value % base;
  const padded = fraction.toString().padStart(decimals, "0");
  const trimmed = padded.replace(/0+$/, "");
  if (trimmed.length === 0) {
    return integer.toString();
  }
  return `${integer.toString()}.${trimmed}`;
}
