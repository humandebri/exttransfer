// components/ext-transfer/transfer-sidebar.tsx: サイドバーでCanister管理とウォレット操作をまとめる。
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
import { type CanisterEntry } from "@/components/ext-transfer/transfer-data";
import { useCanisters } from "@/components/ext-transfer/canister-store";
import WalletConnectPanel from "@/components/ext-transfer/wallet-connect-panel";

export default function TransferSidebar() {
  const {
    canisters,
    addCanister,
    updateCanister,
    removeCanister,
    selectedCanisterId,
    setSelectedCanisterId,
  } = useCanisters();
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeCanister, setActiveCanister] = useState<CanisterEntry | null>(null);
  const [canisterId, setCanisterId] = useState("");
  const [canisterName, setCanisterName] = useState("");
  const [editName, setEditName] = useState("");

  const canSubmit = canisterId.trim().length > 0;
  const canEdit = editName.trim().length > 0 && activeCanister !== null;

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
    addCanister(next);
    setCanisterId("");
    setCanisterName("");
    setModalOpen(false);
  };

  const handleOpenEdit = (canister: CanisterEntry) => {
    setActiveCanister(canister);
    setEditName(canister.name);
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!activeCanister || !canEdit) {
      return;
    }
    updateCanister(activeCanister.id, { name: editName.trim() });
    setEditOpen(false);
  };

  const handleDelete = () => {
    if (!activeCanister) {
      return;
    }
    removeCanister(activeCanister.id);
    setEditOpen(false);
  };

  return (
    <aside className="hidden w-78 flex-col gap-4 rounded-3xl border border-zinc-200/70 bg-white/80 p-5 shadow-sm lg:flex self-stretch">
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
        <ScrollArea className="max-h-[calc(100vh-240px)] pr-2">
          <div className="flex flex-col gap-2">
            {canisters.map((canister) => (
              <div
                key={canister.id}
                className={`rounded-2xl border px-3 py-2 transition ${
                  selectedCanisterId === canister.id
                    ? "border-zinc-900/40 bg-zinc-50"
                    : "border-zinc-200/60 bg-white"
                }`}
                onClick={() => setSelectedCanisterId(canister.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    setSelectedCanisterId(canister.id);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900">
                      {canister.name}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {canister.id}
                    </p>
                    <p className="mt-1 text-xs text-emerald-600">
                      {canister.status}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-zinc-500"
                    onClick={() => handleOpenEdit(canister)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="rounded-2xl border border-zinc-200/60 bg-white px-3 py-3">
          <WalletConnectPanel />
        </div>
      </div>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit canister</DialogTitle>
            <DialogDescription>
              Update the label or remove this collection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-canister-id">Canister ID</Label>
              <Input
                id="edit-canister-id"
                value={activeCanister?.id ?? ""}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-canister-name">Name</Label>
              <Input
                id="edit-canister-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="justify-between sm:justify-between">
            <Button variant="outline" onClick={handleDelete}>
              Remove
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={!canEdit}>
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
