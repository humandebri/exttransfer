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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
    <Card className="group overflow-hidden rounded-3xl border-zinc-200/70 bg-white">
      <CardContent
        className="relative flex flex-col gap-4 p-4 opacity-0 animate-[fade-in_0.6s_ease-out_forwards]"
        style={{ animationDelay: `${0.1 + index * 0.05}s` }}
      >
        <div className={`h-40 rounded-2xl bg-gradient-to-br ${item.tone}`}>
          <div className="flex h-full items-end justify-between p-3">
            <span className="rounded-full bg-white/70 px-2 py-1 text-xs text-zinc-700">
              {item.rarity}
            </span>
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onToggle(item.id, checked)}
              aria-label={`Select ${item.label}`}
            />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-zinc-500">{item.collection}</p>
          <p className="text-lg font-semibold text-zinc-900">{item.label}</p>
          <p className="text-xs text-zinc-500">{item.tokenId}</p>
        </div>
        <Button variant="secondary" className="mt-auto w-full rounded-full">
          Preview
        </Button>
      </CardContent>
    </Card>
  );
}
