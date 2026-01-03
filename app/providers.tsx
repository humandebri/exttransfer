"use client";

// app/providers.tsx: アプリ全体のウォレット/Canister状態を共有するためのプロバイダを定義。
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { WalletProvider } from "@/components/ext-transfer/wallet-context";
import { CanisterProvider } from "@/components/ext-transfer/canister-store";
import {
  ASTROX_CUSTOM_DOMAIN,
  ASTROX_DEV,
  ASTROX_PROVIDER_URL,
  ASTROX_PROVIDER_URLS,
  IC_HOST,
} from "@/lib/runtime-config";
import { useCanisters } from "@/components/ext-transfer/canister-store";

type ProvidersProps = {
  children: ReactNode;
};

function WalletBridge({ children }: { children: ReactNode }) {
  const { canisters } = useCanisters();
  const [providerUrl, setProviderUrl] = useState(ASTROX_PROVIDER_URL);
  const [providerError, setProviderError] = useState<string | null>(null);

  const whitelist = useMemo(() => {
    const ids = canisters.map((entry) => entry.id.trim()).filter(Boolean);
    return Array.from(new Set(ids));
  }, [canisters]);

  const whitelistKey = useMemo(() => whitelist.join("|"), [whitelist]);

  const customDomain = useMemo(() => {
    if (ASTROX_CUSTOM_DOMAIN) {
      return ASTROX_CUSTOM_DOMAIN;
    }
    if (typeof window === "undefined") {
      return "";
    }
    return window.location.origin;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const probe = async () => {
      setProviderError(null);
      for (const url of ASTROX_PROVIDER_URLS) {
        try {
          const response = await fetch(url, { method: "GET", cache: "no-store" });
          if (response.ok) {
            if (!cancelled) {
              setProviderUrl(url);
            }
            return;
          }
        } catch {
          // 次候補へ
        }
      }
      if (!cancelled) {
        setProviderError("AstroX provider is unreachable. Try again later.");
        setProviderUrl(ASTROX_PROVIDER_URLS[0] ?? ASTROX_PROVIDER_URL);
      }
    };
    void probe();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <WalletProvider
      astroxProviderError={providerError}
      astroxWhitelistKey={whitelistKey}
      astroxWhitelist={whitelist}
      astroxProviderUrl={providerUrl}
      astroxCustomDomain={customDomain}
      astroxHost={IC_HOST}
      astroxDev={ASTROX_DEV}
    >
      {children}
    </WalletProvider>
  );
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <CanisterProvider>
      <WalletBridge>{children}</WalletBridge>
    </CanisterProvider>
  );
}
