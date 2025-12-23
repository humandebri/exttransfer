// components/ext-transfer/transfer-progress-modal.tsx: 転送進捗の詳細を表示するモーダル。
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type TransferStatus = "idle" | "pending" | "success" | "error";

export type TransferLogEntry = {
  tokenId: string;
  label: string;
  status: TransferStatus;
  detail?: string;
};

type TransferProgressModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transferLog: TransferLogEntry[];
};

export default function TransferProgressModal({
  open,
  onOpenChange,
  transferLog,
}: TransferProgressModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Transfer status</DialogTitle>
          <DialogDescription>
            Plug uses batch approval when available; transfers run in parallel.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-72 space-y-2 overflow-auto rounded-2xl border border-zinc-200 bg-white p-3 text-sm text-zinc-700">
          {transferLog.length === 0 ? (
            <p className="text-sm text-zinc-500">Preparing transfer list...</p>
          ) : (
            transferLog.map((entry) => (
              <div
                key={entry.tokenId}
                className="space-y-1 rounded-xl border border-zinc-100 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-zinc-800">{entry.label}</span>
                  <span
                    className={`text-xs uppercase tracking-[0.2em] ${
                      entry.status === "success"
                        ? "text-emerald-600"
                        : entry.status === "error"
                          ? "text-rose-500"
                          : entry.status === "pending"
                            ? "text-amber-500"
                            : "text-zinc-400"
                    }`}
                  >
                    {entry.status}
                  </span>
                </div>
                {entry.detail ? (
                  <p className="text-xs text-zinc-500">{entry.detail}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
