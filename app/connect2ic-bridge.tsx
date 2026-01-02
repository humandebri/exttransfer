"use client";

// app/connect2ic-bridge.tsx: Connect2ICとAstroXの設定をクライアント専用で初期化する。
import type { ReactNode } from "react";
import { useMemo } from "react";
import { createClient } from "@connect2ic/core";
import { AstroX } from "@connect2ic/core/providers/astrox";
import { Connect2ICProvider } from "@connect2ic/react";

import { useCanisters } from "@/components/ext-transfer/canister-store";
import { WalletProvider } from "@/components/ext-transfer/wallet-context";
import {
  ASTROX_DEV,
  ASTROX_LEDGER_CANISTER_ID,
  ASTROX_LEDGER_HOST,
  ASTROX_PROVIDER_URL,
  IC_HOST,
} from "@/lib/runtime-config";

type Connect2ICBridgeProps = {
  children: ReactNode;
};

export default function Connect2ICBridge({ children }: Connect2ICBridgeProps) {
  const { canisters } = useCanisters();
  const whitelist = useMemo(() => {
    const ids = canisters.map((entry) => entry.id.trim()).filter(Boolean);
    return Array.from(new Set(ids));
  }, [canisters]);
  const whitelistKey = useMemo(() => whitelist.join("|"), [whitelist]);
  const appHost = useMemo(() => window.location.origin, []);

  const client = useMemo(
    () =>
      createClient({
        providers: [
          new AstroX({
            dev: ASTROX_DEV,
            whitelist,
            host: IC_HOST,
            providerUrl: ASTROX_PROVIDER_URL,
            ledgerCanisterId: ASTROX_LEDGER_CANISTER_ID,
            ledgerHost: ASTROX_LEDGER_HOST,
          }),
        ],
        globalProviderConfig: {
          whitelist,
          host: IC_HOST,
          dev: ASTROX_DEV,
          ledgerCanisterId: ASTROX_LEDGER_CANISTER_ID,
          ledgerHost: ASTROX_LEDGER_HOST,
        },
      }),
    [appHost, whitelistKey]
  );

  return (
    <Connect2ICProvider client={client}>
      <WalletProvider astroxWhitelistKey={whitelistKey}>{children}</WalletProvider>
    </Connect2ICProvider>
  );
}
