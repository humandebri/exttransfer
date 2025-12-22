"use client";

// components/ext-transfer/transfer-workspace.tsx: Main interactive area with selection, filtering, and modal.
import { useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import IdentityKitConnect from "@/components/ext-transfer/identitykit-connect";
import { FILTER_TABS, NFT_ITEMS } from "@/components/ext-transfer/transfer-data";
import TransferTokenGrid from "@/components/ext-transfer/transfer-token-grid";
import { useWalletMeta } from "@/components/ext-transfer/use-wallet-meta";
import { useCanisters } from "@/components/ext-transfer/canister-store";
import { useExtTokens } from "@/components/ext-transfer/use-ext-tokens";

type TransferMode = "principal" | "account";

export default function TransferWorkspace() {
  // Selection stays local to keep UI responsive before canister wiring.
  const [selectedIds, setSelectedIds] = useState<string[]>(["nft-01", "nft-04"]);
  const [transferMode, setTransferMode] = useState<TransferMode>("principal");
  const { accountId } = useWalletMeta();
  const { selectedCanister } = useCanisters();
  const { tokens } = useExtTokens();
  const shortAccountId =
    accountId === "Not connected"
      ? accountId
      : `${accountId.slice(0, 8)}...${accountId.slice(-6)}`;
  const selectedTitle = selectedCanister?.name ?? "Select a collection";
  const fallbackTokens = useMemo(
    () =>
      NFT_ITEMS.map((item) => ({
        id: item.id,
        label: item.name,
        collection: item.collection,
        tokenId: item.tokenId,
        tone: item.tone,
        rarity: item.rarity,
      })),
    []
  );

  const displayTokens = tokens.length > 0 ? tokens : fallbackTokens;
  const selectedCount = selectedIds.length;
  const allSelected = selectedCount === displayTokens.length;

  const selectedLabel = useMemo(() => {
    if (selectedCount === 0) {
      return "Select NFTs to enable bulk transfer";
    }
    return `${selectedCount} selected for transfer`;
  }, [selectedCount]);

  useEffect(() => {
    const validIds = new Set(displayTokens.map((item) => item.id));
    setSelectedIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [displayTokens]);

  const handleSelectAllChange = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedIds(displayTokens.map((item) => item.id));
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
    <main className="flex flex-1 flex-col gap-4">
      <header className="flex flex-col gap-4 rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 font-[var(--font-display)] sm:text-4xl">
              {selectedTitle}
            </h1>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
              Account ID
            </p>
            <p className="text-sm font-medium text-zinc-900">{shortAccountId}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <IdentityKitConnect />
            <Button className="rounded-full">
              <Send className="mr-2 h-4 w-4" />
              New Transfer
            </Button>
          </div>
        </div>
        {/* Status strip intentionally omitted to keep the header minimal. */}
      </header>

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
          <TransferTokenGrid
            tokens={displayTokens}
            selectedIds={selectedIds}
            onToggle={handleToggleItem}
          />
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
