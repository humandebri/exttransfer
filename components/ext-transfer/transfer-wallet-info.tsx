"use client";

// components/ext-transfer/transfer-wallet-info.tsx: Display connected wallet identifiers for user context.
import { useWalletMeta } from "@/components/ext-transfer/use-wallet-meta";

export default function TransferWalletInfo() {
  const { accountId, principalText, walletLabel } = useWalletMeta();

  return (
    <div className="rounded-3xl border border-zinc-200/70 bg-white/80 p-5 text-sm text-zinc-600 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
        Connected wallet
      </p>
      <div className="mt-3 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-zinc-500">Wallet</p>
            <p className="text-sm font-medium text-zinc-900">{walletLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">Account ID</p>
            <p className="break-all text-sm font-medium text-zinc-900">
              {accountId}
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Principal address</p>
          <p className="break-all text-sm font-medium text-zinc-900">
            {principalText}
          </p>
        </div>
      </div>
    </div>
  );
}
