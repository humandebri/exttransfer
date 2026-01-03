// components/ext-transfer/wallet-context.tsx: サイドバー/ワークスペース共通のウォレット状態を保持し、送信元を切替できるようにする。
"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import type { Agent } from "@dfinity/agent";

import { deriveAccountId } from "@/lib/ic-account";
import { AstroXMeConnector } from "@/lib/astrox-me-connector";
import {
  IC_HOST,
  OISY_SIGNER_URL,
  PLUG_HOST,
  STOIC_TRANSPORT,
  STOIC_WALLET_URL,
} from "@/lib/runtime-config";
import { base64ToUint8Array } from "@/lib/base64";
import { OisyRelyingParty } from "@/lib/oisy-relying-party";
import type { PlugProvider } from "@/types/plug";

export type WalletId = "plug" | "stoic" | "oisy" | "astrox";
export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

export type WalletState = {
  id: WalletId;
  name: string;
  status: WalletStatus;
  principalText: string | null;
  accountId: string | null;
  agent: Agent | null;
  relyingParty: OisyRelyingParty | null;
  connector: AstroXMeConnector | null;
  error: string | null;
};

export type ConnectOptions = {
  canisterId?: string;
};

function getErrorMessage(error: unknown): string | null {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return null;
}

function formatStoicError(message: string | null): string {
  if (!message) {
    return "Stoic login failed.";
  }
  if (
    message.includes("openlogin") ||
    message.includes("ERR_NAME_NOT_RESOLVED") ||
    message.toLowerCase().includes("failed to fetch")
  ) {
    return "Stoic login failed: openlogin.com is unreachable.";
  }
  return message;
}

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
    connector: null,
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
    connector: null,
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
    connector: null,
    error: null,
  },
  {
    id: "astrox",
    name: "AstroX ME",
    status: "disconnected",
    principalText: null,
    accountId: null,
    agent: null,
    relyingParty: null,
    connector: null,
    error: null,
  },
];

const WalletContext = createContext<WalletContextValue | null>(null);

let stoicIdentityPromise: Promise<typeof import("ic-stoic-identity").StoicIdentity> | null =
  null;

async function loadStoicIdentity() {
  if (!stoicIdentityPromise) {
    stoicIdentityPromise = import("ic-stoic-identity").then(
      (module) => module.StoicIdentity
    );
  }
  return stoicIdentityPromise;
}

function getPlugProvider(): PlugProvider | null {
  return window.ic?.plug ?? null;
}

function isAccountId(value: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(value);
}

function safeDeriveAccountId(principalText: string | null): string | null {
  if (!principalText) {
    return null;
  }
  try {
    return deriveAccountId(Principal.fromText(principalText));
  } catch {
    return null;
  }
}

export function WalletProvider({
  children,
  astroxProviderError,
  astroxWhitelistKey,
  astroxWhitelist,
  astroxProviderUrl,
  astroxCustomDomain,
  astroxHost,
  astroxDev,
}: {
  children: ReactNode;
  astroxProviderError: string | null;
  astroxWhitelistKey: string;
  astroxWhitelist: string[];
  astroxProviderUrl: string;
  astroxCustomDomain: string;
  astroxHost: string;
  astroxDev: boolean;
}) {
  const [wallets, setWallets] = useState<WalletState[]>(walletDefaults);
  const [activeWalletId, setActiveWalletId] = useState<WalletId | null>(null);
  const [astroxError, setAstroxError] = useState<string | null>(null);
  const [astroxConnector, setAstroxConnector] = useState<AstroXMeConnector | null>(null);
  const [isAstroxConnected, setIsAstroxConnected] = useState(false);
  const previousWhitelistKey = useRef(astroxWhitelistKey);

  useEffect(() => {
    void loadStoicIdentity();
  }, []);

  const updateWallet = useCallback(
    (id: WalletId, patch: Partial<WalletState>) => {
      setWallets((prev) =>
        prev.map((wallet) => (wallet.id === id ? { ...wallet, ...patch } : wallet))
      );
    },
    []
  );

  useEffect(() => {
    const connector = new AstroXMeConnector({
      whitelist: astroxWhitelist,
      host: astroxHost,
      providerUrl: astroxProviderUrl,
      customDomain: astroxCustomDomain,
      dev: astroxDev,
    });
    setAstroxConnector(connector);
  }, [astroxWhitelistKey, astroxHost, astroxProviderUrl, astroxCustomDomain, astroxDev]);

  useEffect(() => {
    if (!astroxConnector) {
      updateWallet("astrox", {
        status: astroxError ? "error" : "disconnected",
        principalText: null,
        accountId: null,
        agent: null,
        relyingParty: null,
        connector: null,
        error: astroxError,
      });
      return;
    }
    updateWallet("astrox", {
      connector: astroxConnector,
    });
  }, [astroxConnector, astroxError, updateWallet]);

  useEffect(() => {
    if (!astroxConnector) {
      return;
    }
    let cancelled = false;
    const bootstrap = async () => {
      const result = await astroxConnector.init();
      if (cancelled) {
        return;
      }
      if (result.isOk() && result.value.isConnected) {
        const wallet = astroxConnector.getWallet();
        const principalText = astroxConnector.principal ?? wallet?.principal ?? null;
        const accountId = wallet?.accountId ?? safeDeriveAccountId(principalText);
        setIsAstroxConnected(true);
        updateWallet("astrox", {
          status: "connected",
          principalText,
          accountId,
          agent: null,
          relyingParty: null,
          connector: astroxConnector,
          error: null,
        });
        setActiveWalletId((prev) => prev ?? "astrox");
        return;
      }
      setIsAstroxConnected(false);
      updateWallet("astrox", {
        status: astroxError ? "error" : "disconnected",
        principalText: null,
        accountId: null,
        agent: null,
        relyingParty: null,
        connector: astroxConnector,
        error: astroxError,
      });
    };
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [astroxConnector, astroxError, setActiveWalletId, updateWallet]);

  // whitelist変更時はAstroXの権限を更新するため再接続を促す。
  useEffect(() => {
    if (previousWhitelistKey.current === astroxWhitelistKey) {
      return;
    }
    previousWhitelistKey.current = astroxWhitelistKey;
    if (!isAstroxConnected) {
      return;
    }
    setAstroxError("Canister list changed. Reconnect AstroX to update access.");
    void astroxConnector?.disconnect();
    setIsAstroxConnected(false);
  }, [astroxConnector, astroxWhitelistKey, isAstroxConnected]);

  useEffect(() => {
    if (!astroxProviderError) {
      return;
    }
    setAstroxError(astroxProviderError);
  }, [astroxProviderError]);

  useEffect(() => {
    const restoreSessions = async () => {
      if (typeof window === "undefined") {
        return;
      }
      const plug = getPlugProvider();
      if (plug) {
        try {
          const principalText = typeof plug.principalId === "string" ? plug.principalId : null;
          const plugAccountId =
            typeof plug.accountId === "string" && isAccountId(plug.accountId)
              ? plug.accountId
              : null;
          const shouldRestore = !!principalText || !!plugAccountId;
          if (shouldRestore) {
            const agent = plug.agent ?? null;
            const accountId = plugAccountId ?? safeDeriveAccountId(principalText);
            updateWallet("plug", {
              status: "connected",
              principalText,
              accountId,
              agent,
              relyingParty: null,
              connector: null,
              error: null,
            });
            setActiveWalletId((prev) => prev ?? "plug");
          }
        } catch {
          updateWallet("plug", {
            status: "disconnected",
            principalText: null,
            accountId: null,
            agent: null,
            relyingParty: null,
            connector: null,
            error: null,
          });
        }
      }
      try {
        const StoicIdentity = await loadStoicIdentity();
        const identity = await StoicIdentity.load(
          STOIC_WALLET_URL,
          STOIC_TRANSPORT
        );
        if (identity) {
          const agent = new HttpAgent({ host: IC_HOST, identity });
          const principalText = identity.getPrincipal().toString();
          const accountId = deriveAccountId(identity.getPrincipal());
          updateWallet("stoic", {
            status: "connected",
            principalText,
            accountId,
            agent,
            relyingParty: null,
            connector: null,
            error: null,
          });
          setActiveWalletId((prev) => prev ?? "stoic");
        }
      } catch {
        updateWallet("stoic", {
          status: "disconnected",
          principalText: null,
          accountId: null,
          agent: null,
          relyingParty: null,
          connector: null,
          error: null,
        });
      }
    };
    void restoreSessions();
  }, [updateWallet]);

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
          const whitelist = options?.canisterId ? [options.canisterId] : [];
          await plug.requestConnect({
            whitelist: whitelist.length ? whitelist : undefined,
            host: PLUG_HOST,
            timeout: 50000,
          });
          if (whitelist.length) {
            await plug.createAgent({ whitelist, host: PLUG_HOST });
          }
          const agent = plug.agent ?? null;
          const principalText =
            plug.principalId ?? (agent ? (await agent.getPrincipal()).toText() : null);
          const plugAccountId =
            typeof plug.accountId === "string" && isAccountId(plug.accountId)
              ? plug.accountId
              : null;
          const accountId = plugAccountId ?? safeDeriveAccountId(principalText);
          plug.onExternalDisconnect(() => {
            updateWallet("plug", {
              status: "disconnected",
              principalText: null,
              accountId: null,
              agent: null,
              relyingParty: null,
              connector: null,
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
            connector: null,
          });
          setActiveWalletId("plug");
          return;
        }

        if (id === "stoic") {
          const StoicIdentity = await loadStoicIdentity();
          const identity = await StoicIdentity.connect(
            STOIC_WALLET_URL,
            STOIC_TRANSPORT
          );
          const agent = new HttpAgent({ host: IC_HOST, identity });
          const principalText = identity.getPrincipal().toString();
          const accountId = deriveAccountId(identity.getPrincipal());
          updateWallet("stoic", {
            status: "connected",
            principalText,
            accountId,
            agent,
            relyingParty: null,
            connector: null,
          });
          setActiveWalletId("stoic");
          return;
        }

        if (id === "astrox") {
          if (!astroxConnector) {
            const message = "AstroX connector is not ready.";
            setAstroxError(message);
            updateWallet("astrox", {
              status: "error",
              error: message,
              principalText: null,
              accountId: null,
              agent: null,
              relyingParty: null,
              connector: null,
            });
            return;
          }
          setAstroxError(null);
          updateWallet("astrox", { status: "connecting", error: null, connector: astroxConnector });
          try {
            await astroxConnector.init();
            const connectResult = await astroxConnector.connect();
            if (connectResult.isOk() && connectResult.value) {
              const wallet = astroxConnector.getWallet();
              const principalText = astroxConnector.principal ?? wallet?.principal ?? null;
              const accountId = wallet?.accountId ?? safeDeriveAccountId(principalText);
              setIsAstroxConnected(true);
              updateWallet("astrox", {
                status: "connected",
                principalText,
                accountId,
                agent: null,
                relyingParty: null,
                connector: astroxConnector,
                error: null,
              });
              setActiveWalletId("astrox");
              return;
            }
            const message = connectResult.isErr() ? connectResult.error.message ?? "AstroX connect failed." : "AstroX connect failed.";
            setAstroxError(message);
            setIsAstroxConnected(false);
            updateWallet("astrox", {
              status: "error",
              error: message,
              principalText: null,
              accountId: null,
              agent: null,
              relyingParty: null,
              connector: astroxConnector,
            });
          } catch (error) {
            const message = getErrorMessage(error) ?? "AstroX connect failed.";
            setAstroxError(message);
            setIsAstroxConnected(false);
            updateWallet("astrox", {
              status: "error",
              error: message,
              principalText: null,
              accountId: null,
              agent: null,
              relyingParty: null,
              connector: astroxConnector,
            });
          } finally {
            // no-op
          }
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
          connector: null,
        });
        setActiveWalletId("oisy");
      } catch (error) {
        const message = getErrorMessage(error);
        const displayError =
          id === "stoic" ? formatStoicError(message) : message ?? "Unknown error";
        updateWallet(id, {
          status: "error",
          error: displayError,
          principalText: null,
          accountId: null,
          agent: null,
          relyingParty: null,
          connector: null,
        });
      }
    },
    [astroxConnector, updateWallet]
  );

  const disconnectWallet = useCallback(
    async (id: WalletId) => {
      if (id === "astrox") {
        setAstroxError(null);
        await astroxConnector?.disconnect();
        setIsAstroxConnected(false);
      }
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
        connector: null,
        error: null,
      });
      setActiveWalletId((prev) => (prev === id ? null : prev));
    },
    [astroxConnector, setActiveWalletId, updateWallet, wallets]
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
        host: PLUG_HOST,
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
