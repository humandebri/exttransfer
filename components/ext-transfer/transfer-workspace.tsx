"use client";

// components/ext-transfer/transfer-workspace.tsx: Main interactive area with selection, filtering, and modal.
import { useMemo, useState } from "react";
import { ConnectWallet } from "@nfid/identitykit/react";
import { ChevronRight, LoaderCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FILTER_TABS,
  NFT_ITEMS,
  type NftItem,
} from "@/components/ext-transfer/transfer-data";

type TransferMode = "principal" | "account";

type StatCard = {
  label: string;
  value: string;
  note: string;
};

const STAT_CARDS: StatCard[] = [
  {
    label: "Active canisters",
    value: "12",
    note: "Across 4 collections",
  },
  {
    label: "Queued transfers",
    value: "24",
    note: "5.4% completion drift",
  },
  {
    label: "Coverage",
    value: "63.9%",
    note: "Tokens mapped with images",
  },
];

export default function TransferWorkspace() {
  // Selection stays local to keep UI responsive before canister wiring.
  const [selectedIds, setSelectedIds] = useState<string[]>(["nft-01", "nft-04"]);
  const [transferMode, setTransferMode] = useState<TransferMode>("principal");

  const selectedCount = selectedIds.length;
  const allSelected = selectedCount === NFT_ITEMS.length;

  const selectedLabel = useMemo(() => {
    if (selectedCount === 0) {
      return "Select NFTs to enable bulk transfer";
    }
    return `${selectedCount} selected for transfer`;
  }, [selectedCount]);

  const handleSelectAllChange = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedIds(NFT_ITEMS.map((item) => item.id));
      return;
    }
    setSelectedIds([]);
  };

  const handleToggleItem = (id: string, checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      return;
    }
    setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
  };

  return (
    <main className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              EXT bulk transfer
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 font-[var(--font-display)] sm:text-4xl">
              Dispatch NFTs with precision
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-600 shadow-sm">
              <ConnectWallet />
            </div>
            <Button className="rounded-full">
              <Send className="mr-2 h-4 w-4" />
              New Transfer
            </Button>
          </div>
        </div>
        {/* Status strip intentionally omitted to keep the header minimal. */}
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {STAT_CARDS.map((stat, index) => (
          <Card
            key={stat.label}
            className="border-zinc-200/70 bg-white/80 shadow-sm"
          >
            <CardContent
              className="flex flex-col gap-2 p-6 opacity-0 animate-[fade-in_0.6s_ease-out_forwards]"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {stat.label}
              </p>
              <p className="text-3xl font-semibold text-zinc-900">
                {stat.value}
              </p>
              <p className="text-sm text-zinc-500">{stat.note}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleSelectAllChange}
              aria-label="Select all NFTs"
            />
            <div>
              <p className="text-sm font-medium text-zinc-900">
                {selectedLabel}
              </p>
              <p className="text-xs text-zinc-500">
                Select all to include every visible token
              </p>
            </div>
          </div>
          {/* Transfer dialog is ready for wiring once EXT transfer is connected. */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="rounded-full" disabled={selectedCount === 0}>
                <Send className="mr-2 h-4 w-4" />
                Bulk transfer
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Transfer destination</DialogTitle>
                <DialogDescription>
                  Paste a Principal or Account ID to dispatch selected NFTs.
                </DialogDescription>
              </DialogHeader>
              <Tabs
                value={transferMode}
                onValueChange={(value) => {
                  if (value === "principal" || value === "account") {
                    setTransferMode(value);
                  }
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="principal">Principal</TabsTrigger>
                  <TabsTrigger value="account">Account ID</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient</Label>
                  <Input
                    id="recipient"
                    placeholder={
                      transferMode === "principal" ? "aaaaa-aa" : "a3b4...f8"
                    }
                  />
                </div>
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                  {selectedCount} NFTs will be transferred sequentially.
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary">Save draft</Button>
                <Button>Confirm transfer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <Tabs defaultValue={FILTER_TABS[0]} className="w-full sm:w-auto">
            <TabsList className="rounded-full">
              {FILTER_TABS.map((tab) => (
                <TabsTrigger key={tab} value={tab} className="rounded-full">
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" className="rounded-full">
              Queue tokens
            </Button>
            <Button variant="outline" className="rounded-full">
              Export list
            </Button>
          </div>
        </div>

        <ScrollArea className="mt-6 h-[420px] pr-2">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {NFT_ITEMS.map((item, index) => (
              <NftCard
                key={item.id}
                item={item}
                index={index}
                isSelected={selectedIds.includes(item.id)}
                onToggle={handleToggleItem}
              />
            ))}
          </div>
        </ScrollArea>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
        <span>EXT Transfer Studio, design reference applied.</span>
        <span className="flex items-center gap-2">
          Need live data? Connect canisters from the left panel.
        </span>
      </footer>
    </main>
  );
}

type NftCardProps = {
  item: NftItem;
  index: number;
  isSelected: boolean;
  onToggle: (id: string, checked: boolean | "indeterminate") => void;
};

function NftCard({ item, index, isSelected, onToggle }: NftCardProps) {
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
              aria-label={`Select ${item.name}`}
            />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-zinc-500">{item.collection}</p>
          <p className="text-lg font-semibold text-zinc-900">{item.name}</p>
          <p className="text-xs text-zinc-500">{item.tokenId}</p>
        </div>
        <Button variant="secondary" className="mt-auto w-full rounded-full">
          Preview
        </Button>
      </CardContent>
    </Card>
  );
}
