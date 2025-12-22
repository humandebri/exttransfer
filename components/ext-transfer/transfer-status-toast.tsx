// components/ext-transfer/transfer-status-toast.tsx: 転送単位のトーストを右下に積む。
"use client";

import { Button } from "@/components/ui/button";

export type TransferStatus = "idle" | "pending" | "success" | "error";

export type TransferLogEntry = {
  tokenId: string;
  label: string;
  status: TransferStatus;
  detail?: string;
};

type TransferStatusToastProps = {
  open: boolean;
  running: boolean;
  transferLog: TransferLogEntry[];
  onDismiss: () => void;
  onViewDetails: () => void;
};

export default function TransferStatusToast({
  open,
  running,
  transferLog,
  onDismiss,
  onViewDetails,
}: TransferStatusToastProps) {
  if (!open) {
    return null;
  }
  const visibleItems = transferLog.slice(0, 6);
  const remaining = transferLog.length - visibleItems.length;
  const headerText = running ? "Transferring..." : "Transfer summary";
  const statusTone = running ? "text-amber-600" : "text-zinc-600";
  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-80 flex-col gap-3">
      <div className="rounded-2xl border border-zinc-200/70 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-900">{headerText}</p>
            <p className={`text-xs ${statusTone}`}>
              {transferLog.length} items
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-zinc-500"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="mt-3 w-full rounded-full"
          onClick={onViewDetails}
        >
          View details
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {visibleItems.map((entry) => (
          <div
            key={entry.tokenId}
            className="rounded-2xl border border-zinc-200/80 bg-white/95 px-3 py-2 shadow-sm backdrop-blur"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-medium text-zinc-900">
                {entry.label}
              </p>
              <span
                className={`text-[11px] uppercase tracking-[0.2em] ${
                  entry.status === "success"
                    ? "text-emerald-600"
                    : entry.status === "error"
                      ? "text-rose-500"
                      : entry.status === "pending"
                        ? "text-amber-600"
                        : "text-zinc-400"
                }`}
              >
                {entry.status}
              </span>
            </div>
            {entry.detail ? (
              <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                {entry.detail}
              </p>
            ) : null}
          </div>
        ))}
        {remaining > 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200/80 bg-white/70 px-3 py-2 text-xs text-zinc-500">
            +{remaining} more transfers in progress
          </div>
        ) : null}
      </div>
    </div>
  );
}
