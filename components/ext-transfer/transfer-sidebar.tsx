// components/ext-transfer/transfer-sidebar.tsx: Sidebar navigation and canister management for the workspace.
"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import {
  CANISTERS,
  NAV_ITEMS,
  type CanisterEntry,
} from "@/components/ext-transfer/transfer-data";

export default function TransferSidebar() {
  const [canisters, setCanisters] = useState<CanisterEntry[]>(() => [
    ...CANISTERS,
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [canisterId, setCanisterId] = useState("");
  const [canisterName, setCanisterName] = useState("");

  const canSubmit = canisterId.trim().length > 0;

  const handleAddCanister = () => {
    if (!canSubmit) {
      return;
    }
    const trimmedId = canisterId.trim();
    const trimmedName = canisterName.trim() || "Custom Collection";
    const next: CanisterEntry = {
      id: trimmedId,
      name: trimmedName,
      status: "Active",
    };
    setCanisters((prev) => [next, ...prev]);
    setCanisterId("");
    setCanisterName("");
    setModalOpen(false);
  };

  return (
    <aside className="hidden w-72 flex-col gap-6 rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm lg:flex">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">EXT</p>
          <p className="text-lg font-semibold tracking-tight text-zinc-900 font-[var(--font-display)]">
            Transfer Studio
          </p>
        </div>
        <span className="rounded-full bg-zinc-900 px-2 py-1 text-xs text-white">
          v1.0
        </span>
      </div>

      <Separator />

      <nav className="flex flex-col gap-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={`flex items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition ${
              item.active
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
            type="button"
          >
            <span className="flex items-center gap-3">
              <item.icon className="h-4 w-4" />
              {item.label}
            </span>
            {item.badge ? (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  item.active
                    ? "bg-white/20 text-white"
                    : "bg-zinc-200 text-zinc-700"
                }`}
              >
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <Separator />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Canisters
          </p>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary" className="rounded-full">
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Add NFT canister</DialogTitle>
                <DialogDescription>
                  Register a collection canister to load its tokens.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="canister-id">Canister ID</Label>
                  <Input
                    id="canister-id"
                    placeholder="aaaaa-aa"
                    value={canisterId}
                    onChange={(event) => setCanisterId(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="canister-name">Name (optional)</Label>
                  <Input
                    id="canister-name"
                    placeholder="Collection name"
                    value={canisterName}
                    onChange={(event) => setCanisterName(event.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddCanister} disabled={!canSubmit}>
                  Add canister
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="h-64 pr-2">
          <div className="flex flex-col gap-2">
            {canisters.map((canister) => (
              <div
                key={canister.id}
                className="rounded-2xl border border-zinc-200/60 bg-white px-3 py-2"
              >
                <p className="text-sm font-medium text-zinc-900">
                  {canister.name}
                </p>
                <p className="text-xs text-zinc-500">{canister.id}</p>
                <p className="mt-1 text-xs text-emerald-600">
                  {canister.status}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
