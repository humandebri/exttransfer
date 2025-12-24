"use client";

// components/ext-transfer/transfer-token-grid.tsx: Grid rendering for tokens with selection.
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DisplayToken } from "@/components/ext-transfer/use-ext-tokens";
import type { ListingDisplay } from "@/components/ext-transfer/use-ext-listings";

type TokenGridProps = {
  tokens: DisplayToken[];
  selectedIds: string[];
  listingsByIndex: Record<number, ListingDisplay>;
  listingsLoading: boolean;
  listingsError: string | null;
  onToggle: (id: string, checked: boolean | "indeterminate") => void;
};

export default function TransferTokenGrid({
  tokens,
  selectedIds,
  listingsByIndex,
  listingsLoading,
  listingsError,
  onToggle,
}: TokenGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 md:gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-9">
      {tokens.map((item, index) => (
        <TokenCard
          key={item.id}
          item={item}
          index={index}
          isSelected={selectedIds.includes(item.id)}
          listing={listingsByIndex[item.tokenIndex]}
          listingsLoading={listingsLoading}
          listingsError={listingsError}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

type TokenCardProps = {
  item: DisplayToken;
  index: number;
  isSelected: boolean;
  listing?: ListingDisplay;
  listingsLoading: boolean;
  listingsError: string | null;
  onToggle: (id: string, checked: boolean | "indeterminate") => void;
};

function TokenCard({
  item,
  index,
  isSelected,
  listing,
  listingsLoading,
  listingsError,
  onToggle,
}: TokenCardProps) {
  const listingLink =
    listing?.sellerFrontend && normalizeListingLink(listing.sellerFrontend);
  return (
    <Card
      className={`group overflow-hidden rounded-3xl border bg-white transition ${
        isSelected
          ? "border-zinc-900/60 ring-2 ring-zinc-900/20 shadow-md"
          : "border-zinc-200/70 shadow-sm"
      }`}
    >
      <CardContent
        className="relative flex flex-col gap-1 p-2 opacity-0 animate-[fade-in_0.6s_ease-out_forwards]"
        style={{ animationDelay: `${0.1 + index * 0.05}s` }}
      >
        <div
          role="button"
          tabIndex={0}
          className={`relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br ${item.tone}`}
          onClick={() => onToggle(item.id, !isSelected)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              onToggle(item.id, !isSelected);
            }
          }}
        >
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.label}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          ) : null}
          <div className="absolute inset-0 flex items-end justify-end p-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onToggle(item.id, checked)}
              aria-label={`Select ${item.label}`}
            />
          </div>
        </div>
        <div >
          <p className="text-lg font-semibold text-zinc-900">{item.label}</p>
          {listingsLoading ? (
            <p className="text-xs text-zinc-400">Loading listings...</p>
          ) : listingsError ? (
            <p className="text-xs text-zinc-400">Listings unavailable</p>
          ) : listing ? (
            <div className="space-y-1 text-xs">
              <p className="text-emerald-700">Listed: {listing.priceLabel}</p>
              {listingLink ? (
                <a
                  href={listingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-500 underline decoration-dotted underline-offset-4"
                >
                  Direct link to listings
                </a>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-zinc-400">Not listed</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function normalizeListingLink(value: string): string {
  if (value.startsWith("https://") || value.startsWith("http://")) {
    return value;
  }
  return `https://${value}`;
}
