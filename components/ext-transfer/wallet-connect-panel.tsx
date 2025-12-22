// components/ext-transfer/wallet-connect-panel.tsx: サイドバーでウォレット接続と送信元切替を行うためのUI。
"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { useWallets } from "@/components/ext-transfer/wallet-context";
import { useCanisters } from "@/components/ext-transfer/canister-store";

function shorten(value: string): string {
  if (value.length <= 12) {
    return value;
  }
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export default function WalletConnectPanel() {
  const { wallets, activeWalletId, connectWallet, disconnectWallet, setActiveWalletId } =
    useWallets();
  const { selectedCanister } = useCanisters();
  const canisterHint = selectedCanister?.id;

  const activeWalletLabel = useMemo(() => {
    const active = wallets.find((wallet) => wallet.id === activeWalletId);
    return active?.name ?? "None";
  }, [wallets, activeWalletId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Wallets
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {wallets.map((wallet) => {
          const connected = wallet.status === "connected";
          const isActive = wallet.id === activeWalletId;
          const accountPreview = wallet.accountId
            ? shorten(wallet.accountId)
            : "Not connected";
          return (
            <div
              key={wallet.id}
              className={`rounded-2xl border px-3 py-2 ${
                isActive
                  ? "border-zinc-900/40 bg-zinc-50"
                  : "border-zinc-200/60 bg-white"
              }`}
              role={connected ? "button" : undefined}
              tabIndex={connected ? 0 : undefined}
              onClick={() => {
                if (connected && !isActive) {
                  setActiveWalletId(wallet.id);
                }
              }}
              onKeyDown={(event) => {
                if (!connected || isActive) {
                  return;
                }
                if (event.key === "Enter" || event.key === " ") {
                  setActiveWalletId(wallet.id);
                }
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900">
                    {wallet.name}
                  </p>
                  <p className="text-xs text-zinc-500">{accountPreview}</p>
                </div>
                <div className="flex items-center gap-2">
                  {connected ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-zinc-500"
                        onClick={() => disconnectWallet(wallet.id)}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-full"
                      onClick={() =>
                        connectWallet(wallet.id, {
                          canisterId: wallet.id === "plug" ? canisterHint : undefined,
                        })
                      }
                      disabled={wallet.status === "connecting"}
                    >
                      {wallet.status === "connecting" ? "Connecting..." : "Connect"}
                    </Button>
                  )}
                </div>
              </div>
              {wallet.error ? (
                <p className="mt-2 text-xs text-rose-500">{wallet.error}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
