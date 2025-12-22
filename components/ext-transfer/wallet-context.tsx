// components/ext-transfer/wallet-context.tsx: サイドバー/ワークスペース共通のウォレット状態を保持し、送信元を切替できるようにする。
"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import type { Agent } from "@dfinity/agent";

import { deriveAccountId } from "@/lib/ic-account";
import { IC_HOST, OISY_SIGNER_URL } from "@/lib/runtime-config";
import { base64ToUint8Array } from "@/lib/base64";
import { OisyRelyingParty } from "@/lib/oisy-relying-party";
import type { PlugProvider } from "@/types/plug";

export type WalletId = "plug" | "stoic" | "oisy";
export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

export type WalletState = {
  id: WalletId;
  name: string;
  status: WalletStatus;
  principalText: string | null;
  accountId: string | null;
  agent: Agent | null;
  relyingParty: OisyRelyingParty | null;
  error: string | null;
};

export type ConnectOptions = {
  canisterId?: string;
};

type WalletContextValue = {
  wallets: WalletState[];
  activeWalletId: WalletId | null;
  activeWallet: WalletState | null;
  connectWallet: (id: WalletId, options?: ConnectOptions) => Promise<void>;
  disconnectWallet: (id: WalletId) => Promise<void>;
  setActiveWalletId: (id: WalletId) => void;
  ensureActiveCanisterAccess: (canisterId: string) => Promise<void>;
};

const walletDefaults: WalletState[] = [
  {
    id: "plug",
    name: "Plug",
    status: "disconnected",
    principalText: null,
    accountId: null,
    agent: null,
    relyingParty: null,
    error: null,
  },
  {
    id: "stoic",
    name: "Stoic",
    status: "disconnected",
    principalText: null,
    accountId: null,
    agent: null,
    relyingParty: null,
    error: null,
  },
  {
    id: "oisy",
    name: "OISY",
    status: "disconnected",
    principalText: null,
    accountId: null,
    agent: null,
    relyingParty: null,
    error: null,
  },
];

const WalletContext = createContext<WalletContextValue | null>(null);

async function loadStoicIdentity() {
  const module = await import("ic-stoic-identity");
  return module.StoicIdentity;
}

function getPlugProvider(): PlugProvider | null {
  return window.ic?.plug ?? null;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<WalletState[]>(walletDefaults);
  const [activeWalletId, setActiveWalletId] = useState<WalletId | null>(null);

  const updateWallet = useCallback(
    (id: WalletId, patch: Partial<WalletState>) => {
      setWallets((prev) =>
        prev.map((wallet) => (wallet.id === id ? { ...wallet, ...patch } : wallet))
      );
    },
    []
  );

  const connectWallet = useCallback(
    async (id: WalletId, options?: ConnectOptions) => {
      updateWallet(id, { status: "connecting", error: null });
      try {
        if (id === "plug") {
          const plug = getPlugProvider();
          if (!plug) {
            throw new Error("Plug extension not detected.");
          }
          // Plugはwhitelistに含まれるCanisterのみ署名できるため、選択中を渡す。
          const whitelist = options?.canisterId ? [options.canisterId] : undefined;
          await plug.requestConnect({
            whitelist,
            host: IC_HOST,
            timeout: 50000,
          });
          const agent = plug.agent ?? null;
          const principalText =
            plug.principalId ?? (agent ? (await agent.getPrincipal()).toText() : null);
          const accountId =
            plug.accountId ??
            (principalText ? deriveAccountId(Principal.fromText(principalText)) : null);
          plug.onExternalDisconnect(() => {
            updateWallet("plug", {
              status: "disconnected",
              principalText: null,
              accountId: null,
              agent: null,
              relyingParty: null,
              error: null,
            });
            setActiveWalletId((prev) => (prev === "plug" ? null : prev));
          });
          updateWallet("plug", {
            status: "connected",
            principalText,
            accountId,
            agent,
            relyingParty: null,
          });
          setActiveWalletId("plug");
          return;
        }

        if (id === "stoic") {
          const StoicIdentity = await loadStoicIdentity();
          const identity = await StoicIdentity.connect();
          const agent = new HttpAgent({ host: IC_HOST, identity });
          const principalText = identity.getPrincipal().toString();
          const accountId = deriveAccountId(identity.getPrincipal());
          updateWallet("stoic", {
            status: "connected",
            principalText,
            accountId,
            agent,
            relyingParty: null,
          });
          setActiveWalletId("stoic");
          return;
        }

        const relyingParty = await OisyRelyingParty.connect({
          url: OISY_SIGNER_URL,
          host: IC_HOST,
        });
        const { allPermissionsGranted } =
          await relyingParty.requestPermissionsNotGranted();
        if (!allPermissionsGranted) {
          await relyingParty.disconnect();
          throw new Error("OISY permissions are required.");
        }
        const accounts = await relyingParty.accounts();
        const account = accounts[0];
        if (!account) {
          await relyingParty.disconnect();
          throw new Error("No OISY account was returned.");
        }
        const principalText = account.owner;
        const subaccountBytes = account.subaccount
          ? base64ToUint8Array(account.subaccount)
          : undefined;
        const accountId = deriveAccountId(
          Principal.fromText(principalText),
          subaccountBytes
        );
        updateWallet("oisy", {
          status: "connected",
          principalText,
          accountId,
          agent: null,
          relyingParty,
        });
        setActiveWalletId("oisy");
      } catch (error) {
        updateWallet(id, {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          principalText: null,
          accountId: null,
          agent: null,
          relyingParty: null,
        });
      }
    },
    [updateWallet]
  );

  const disconnectWallet = useCallback(
    async (id: WalletId) => {
      if (id === "plug") {
        const plug = getPlugProvider();
        if (plug) {
          plug.disconnect();
        }
      }
      if (id === "stoic") {
        const StoicIdentity = await loadStoicIdentity();
        StoicIdentity.disconnect();
      }
      if (id === "oisy") {
        const current = wallets.find((wallet) => wallet.id === "oisy");
        if (current?.relyingParty) {
          await current.relyingParty.disconnect();
        }
      }
      updateWallet(id, {
        status: "disconnected",
        principalText: null,
        accountId: null,
        agent: null,
        relyingParty: null,
        error: null,
      });
      setActiveWalletId((prev) => (prev === id ? null : prev));
    },
    [updateWallet, wallets]
  );

  const ensureActiveCanisterAccess = useCallback(
    async (canisterId: string) => {
      if (activeWalletId !== "plug") {
        return;
      }
      const plug = getPlugProvider();
      if (!plug) {
        return;
      }
      // PlugはCanister切替ごとに承認が必要になるため、都度whitelistを更新する。
      await plug.requestConnect({
        whitelist: [canisterId],
        host: IC_HOST,
        timeout: 50000,
      });
    },
    [activeWalletId]
  );

  const activeWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === activeWalletId) ?? null,
    [wallets, activeWalletId]
  );

  const contextValue = useMemo<WalletContextValue>(
    () => ({
      wallets,
      activeWalletId,
      activeWallet,
      connectWallet,
      disconnectWallet,
      setActiveWalletId,
      ensureActiveCanisterAccess,
    }),
    [
      wallets,
      activeWalletId,
      activeWallet,
      connectWallet,
      disconnectWallet,
      setActiveWalletId,
      ensureActiveCanisterAccess,
    ]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallets(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallets must be used within WalletProvider.");
  }
  return context;
}
