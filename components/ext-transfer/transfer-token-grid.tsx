"use client";

// components/ext-transfer/transfer-token-grid.tsx: Grid rendering for tokens with selection.
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DisplayToken } from "@/components/ext-transfer/use-ext-tokens";

type TokenGridProps = {
  tokens: DisplayToken[];
  selectedIds: string[];
  onToggle: (id: string, checked: boolean | "indeterminate") => void;
};

export default function TransferTokenGrid({
  tokens,
  selectedIds,
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
  onToggle: (id: string, checked: boolean | "indeterminate") => void;
};

function TokenCard({ item, index, isSelected, onToggle }: TokenCardProps) {
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
          className="relative aspect-square overflow-hidden rounded-2xl bg-transparent"
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
        <div className="space-y-1">
          <p className="text-lg font-semibold text-zinc-900">{item.label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
