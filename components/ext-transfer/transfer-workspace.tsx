"use client";

// components/ext-transfer/transfer-workspace.tsx: 選択と送信の主要UI。アクティブなウォレットで順次転送する。
import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Send } from "lucide-react";
import { Actor } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { Principal as IcpPrincipal } from "@icp-sdk/core/principal";

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
import TransferTokenGrid from "@/components/ext-transfer/transfer-token-grid";
import TransferTokenSkeleton from "@/components/ext-transfer/transfer-token-skeleton";
import { useWalletMeta } from "@/components/ext-transfer/use-wallet-meta";
import { useCanisters } from "@/components/ext-transfer/canister-store";
import { useExtTokens } from "@/components/ext-transfer/use-ext-tokens";
import { useExtListings } from "@/components/ext-transfer/use-ext-listings";
import { useWallets } from "@/components/ext-transfer/wallet-context";
import TransferProgressModal, {
  type TransferLogEntry,
} from "@/components/ext-transfer/transfer-progress-modal";
import TransferStatusToast, {
  type TransferLogEntry as ToastLogEntry,
} from "@/components/ext-transfer/transfer-status-toast";
import {
  formatTransferError,
  transferIdlFactory,
  type TransferActor,
  transferExtToken,
} from "@/lib/ext-transfer";
import { IC_HOST, TRANSFER_TIMEOUT_MS } from "@/lib/runtime-config";
import {
  buildOisyTransferCallParams,
  decodeOisyTransferResponse,
  type OisyTransferRequest,
} from "@/lib/ext-transfer-icrc";

type TransferMode = "principal" | "account";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Transfer timeout"));
    }, timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function isValidAccountId(value: string): boolean {
  const normalized = value.startsWith("0x") ? value.slice(2) : value;
  return /^[0-9a-fA-F]{64}$/.test(normalized);
}

export default function TransferWorkspace() {
  // 選択状態はローカルに保持し、通信前でもUIが軽く動くようにする。
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [transferMode, setTransferMode] = useState<TransferMode>("principal");
  const [recipient, setRecipient] = useState("");
  const [transferLog, setTransferLog] = useState<TransferLogEntry[]>([]);
  const [transferRunning, setTransferRunning] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const { accountId } = useWalletMeta();
  const { activeWallet, ensureActiveCanisterAccess, wallets } = useWallets();
  const { selectedCanister } = useCanisters();
  const { tokens, loading, refresh } = useExtTokens();
  const { listingsByIndex, loading: listingsLoading, error: listingsError } =
    useExtListings();
  const walletReady =
    !!activeWallet &&
    activeWallet.status === "connected" &&
    (activeWallet.id === "oisy"
      ? !!activeWallet.relyingParty
      : activeWallet.id === "plug"
        ? true
        : activeWallet.id === "astrox"
          ? !!activeWallet.connector
        : !!activeWallet.agent);
  const shortAccountId =
    accountId === "Not connected"
      ? accountId
      : `${accountId.slice(0, 8)}...${accountId.slice(-6)}`;
  const selectedTitle = selectedCanister?.name ?? "Select a collection";
  const displayTokens = tokens;
  const selectedCount = selectedIds.length;
  const allSelected = selectedCount === displayTokens.length;
  const trimmedRecipient = recipient.trim();
  const isOisyUnsupported = activeWallet?.id === "oisy";
  const isRecipientValid = useMemo(() => {
    if (!trimmedRecipient) {
      return false;
    }
    if (transferMode === "principal") {
      try {
        Principal.fromText(trimmedRecipient);
        return true;
      } catch {
        return false;
      }
    }
    return isValidAccountId(trimmedRecipient);
  }, [trimmedRecipient, transferMode]);
  const canSubmitTransfer =
    !transferRunning &&
    selectedCount > 0 &&
    !!selectedCanister &&
    accountId !== "Not connected" &&
    walletReady &&
    isRecipientValid &&
    !isOisyUnsupported;

  const connectedRecipients = useMemo(() => {
    return wallets.filter(
      (wallet) =>
        wallet.status === "connected" &&
        wallet.accountId &&
        wallet.id !== activeWallet?.id
    );
  }, [wallets, activeWallet]);

  const selectedLabel = useMemo(() => {
    if (selectedCount === 0) {
      return "Select NFTs to enable bulk transfer";
    }
    return `${selectedCount} selected for transfer`;
  }, [selectedCount]);

  const toastLog = useMemo<ToastLogEntry[]>(
    () => transferLog.map((entry) => ({ ...entry })),
    [transferLog]
  );

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
    <main className="flex flex-1 flex-col gap-4 self-stretch min-h-0 max-h-none overflow-visible sm:max-h-[calc(100dvh-2rem)] sm:overflow-hidden">
      <header className="flex flex-col gap-4 rounded-3xl border border-zinc-200/70 bg-white/80 p-4 shadow-sm">
        <div className="flex w-full items-start gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 font-[var(--font-display)] sm:text-2xl">
              {selectedTitle}
            </h1>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Account ID
            </p>
            <p className="text-sm font-medium text-zinc-900">
              {shortAccountId}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2" />
        </div>
        {/* ヘッダーは簡潔に保つためステータス行は省略する。 */}
      </header>

      <section className="flex flex-1 flex-col min-h-0 rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm">
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
          {/* 転送先入力はウォレット接続後に有効化される前提。 */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              disabled={loading}
              onClick={() => refresh()}
              aria-label="Reload tokens"
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Dialog
              open={transferDialogOpen}
              onOpenChange={(open) => {
                setTransferDialogOpen(open);
                if (open) {
                  setTransferLog([]);
                  setRecipient("");
                }
              }}
            >
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
                    value={recipient}
                    onChange={(event) => setRecipient(event.target.value)}
                    placeholder={
                      transferMode === "principal" ? "aaaaa-aa" : "a3b4...f8"
                    }
                  />
                  {!isRecipientValid && trimmedRecipient ? (
                    <p className="text-xs text-rose-500">
                      {transferMode === "principal"
                        ? "Invalid Principal"
                        : "Invalid Account ID"}
                    </p>
                  ) : null}
                </div>
                {isOisyUnsupported ? (
                  <p className="text-xs text-rose-500">
                    EXT canisters do not implement ICRC-21, so OISY cannot approve
                    this transfer.
                  </p>
                ) : null}
                {connectedRecipients.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Connected wallets
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {connectedRecipients.map((wallet) => (
                        <Button
                          key={wallet.id}
                          type="button"
                          variant="secondary"
                          className="rounded-full"
                          onClick={() => {
                            setTransferMode("account");
                            setRecipient(wallet.accountId ?? "");
                          }}
                        >
                          {wallet.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                  {selectedCount} NFTs will be transferred sequentially.
                </div>
              </div>
              {transferLog.length > 0 ? (
                <div className="max-h-56 space-y-2 overflow-auto rounded-2xl border border-zinc-200 bg-white p-3 text-sm text-zinc-700">
                  {transferLog.map((entry) => (
                    <div
                      key={entry.tokenId}
                      className="space-y-1 rounded-xl border border-zinc-100 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-zinc-800">
                          {entry.label}
                        </span>
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
                        <p className="text-xs text-zinc-500">
                          {entry.detail}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
              <DialogFooter>
                <Button
                  disabled={!canSubmitTransfer}
                  onClick={async () => {
                    if (!selectedCanister || !activeWallet) {
                      return;
                    }
                    if (!isRecipientValid) {
                      return;
                    }
                    const selectedTokens = displayTokens.filter((token) =>
                      selectedIds.includes(token.id)
                    );
                    if (selectedTokens.length === 0) {
                      return;
                    }
                    setTransferRunning(true);
                    setTransferDialogOpen(false);
                    setProgressDialogOpen(true);
                    setShowToast(false);
                    setTransferLog(
                      selectedTokens.map((token) => ({
                        tokenId: token.id,
                        label: token.label,
                        status: "pending",
                      }))
                    );
                    if (activeWallet?.id === "plug") {
                      await ensureActiveCanisterAccess(selectedCanister.id);
                    }
                    for (const token of selectedTokens) {
                      try {
                        const response = await withTimeout(
                          (async () => {
                            if (activeWallet.id === "oisy") {
                              // OISYはICRC-49経由でcanister呼び出しを行う。
                              const relyingParty = activeWallet.relyingParty;
                              const senderPrincipal = activeWallet.principalText;
                              if (!relyingParty || !senderPrincipal) {
                                throw new Error("OISY wallet is not ready.");
                              }
                              const request: OisyTransferRequest = {
                                to:
                                  transferMode === "principal"
                                    ? {
                                        principal: IcpPrincipal.fromText(
                                          trimmedRecipient
                                        ),
                                      }
                                    : { address: trimmedRecipient },
                                token: token.tokenIdentifier,
                                notify: false,
                                from: { address: accountId },
                                memo: [],
                                subaccount: [],
                                amount: BigInt(1),
                              };
                              const params = buildOisyTransferCallParams(
                                selectedCanister.id,
                                senderPrincipal,
                                request
                              );
                              console.info("[exttransfer] oisy transfer request", {
                                canisterId: selectedCanister.id,
                                token: token.tokenIdentifier,
                                recipient: trimmedRecipient,
                                mode: transferMode,
                              });
                              const result = await relyingParty.callCanister({
                                params,
                              });
                              console.info("[exttransfer] oisy transfer result", {
                                contentMap: result.contentMap,
                              });
                              return decodeOisyTransferResponse({
                                params,
                                result,
                                host: IC_HOST,
                              });
                            }
                          if (activeWallet.id === "astrox") {
                            const connector = activeWallet.connector;
                            if (!connector) {
                              throw new Error("AstroX provider not ready.");
                            }
                            const actorResult =
                              await connector.createActor<TransferActor>(
                                selectedCanister.id,
                                transferIdlFactory
                              );
                            if (actorResult.isErr()) {
                              throw new Error("AstroX actor creation failed.");
                            }
                            return actorResult.value.transfer({
                              to:
                                transferMode === "principal"
                                  ? {
                                      principal: Principal.fromText(
                                        trimmedRecipient
                                      ),
                                    }
                                  : { address: trimmedRecipient },
                              token: token.tokenIdentifier,
                              notify: false,
                              from: { address: accountId },
                              memo: [],
                              subaccount: [],
                              amount: BigInt(1),
                            });
                          }
                          if (activeWallet.id === "plug") {
                            const plug = window.ic?.plug;
                            if (!plug) {
                              throw new Error("Plug extension not detected.");
                            }
                            const plugAgent = plug.agent ?? null;
                            if (!plugAgent) {
                              throw new Error("Plug agent is not available.");
                            }
                            const actor = await Actor.createActor<TransferActor>(
                              transferIdlFactory,
                              {
                                agent: plugAgent,
                                canisterId: selectedCanister.id,
                              }
                            );
                            return actor.transfer({
                              to:
                                transferMode === "principal"
                                  ? {
                                      principal: Principal.fromText(
                                        trimmedRecipient
                                      ),
                                    }
                                  : { address: trimmedRecipient },
                              token: token.tokenIdentifier,
                              notify: false,
                              from: { address: accountId },
                              memo: [],
                              subaccount: [],
                              amount: BigInt(1),
                            });
                          }
                          if (!activeWallet.agent) {
                            throw new Error("Active wallet agent missing.");
                          }
                          return transferExtToken(
                            activeWallet.agent,
                            selectedCanister.id,
                            {
                              to:
                                transferMode === "principal"
                                  ? {
                                      principal: Principal.fromText(
                                        trimmedRecipient
                                      ),
                                    }
                                  : { address: trimmedRecipient },
                              token: token.tokenIdentifier,
                              notify: false,
                              from: { address: accountId },
                              memo: [],
                              subaccount: [],
                              amount: BigInt(1),
                            }
                          );
                        })(),
                          TRANSFER_TIMEOUT_MS
                        );
                        if ("err" in response) {
                          setTransferLog((prev) =>
                            prev.map((entry) =>
                              entry.tokenId === token.id
                                ? {
                                    ...entry,
                                    status: "error",
                                    detail: formatTransferError(response.err),
                                  }
                                : entry
                            )
                          );
                          continue;
                        }
                        setTransferLog((prev) =>
                          prev.map((entry) =>
                            entry.tokenId === token.id
                              ? { ...entry, status: "success" }
                              : entry
                          )
                        );
                      } catch (error) {
                        setTransferLog((prev) =>
                          prev.map((entry) =>
                            entry.tokenId === token.id
                              ? {
                                  ...entry,
                                  status: "error",
                                  detail:
                                    error instanceof Error
                                      ? error.message
                                      : "Unknown error",
                                }
                              : entry
                          )
                        );
                      }
                    }
                    setTransferRunning(false);
                    setShowToast(true);
                  }}
                >
                  {transferRunning ? "Transferring..." : "Confirm transfer"}
                </Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          </div>
          <TransferProgressModal
            open={progressDialogOpen}
            onOpenChange={(open) => {
              setProgressDialogOpen(open);
              if (!open) {
                setShowToast(true);
              }
            }}
            transferLog={transferLog}
          />
        </div>

        <ScrollArea className="mt-6 min-h-0 flex-1 pr-2">
          {loading ? (
            <TransferTokenSkeleton />
          ) : displayTokens.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
              No tokens
            </div>
          ) : (
            <TransferTokenGrid
              tokens={displayTokens}
              selectedIds={selectedIds}
              listingsByIndex={listingsByIndex}
              listingsLoading={listingsLoading}
              listingsError={listingsError}
              onToggle={handleToggleItem}
            />
          )}
        </ScrollArea>
      </section>
      <TransferStatusToast
        open={showToast && transferLog.length > 0}
        running={transferRunning}
        transferLog={toastLog}
        onDismiss={() => setShowToast(false)}
        onViewDetails={() => setProgressDialogOpen(true)}
      />

    </main>
  );
}
