"use client";

// components/ext-transfer/use-wallet-meta.ts: Centralize wallet identity strings for consistent UI labels.
import { useMemo } from "react";
import { useAccounts, useIdentity } from "@nfid/identitykit/react";

import { deriveAccountId } from "@/lib/ic-account";

export type WalletMeta = {
  accountId: string;
  principalText: string;
  walletLabel: string;
};

export function useWalletMeta(): WalletMeta {
  const identity = useIdentity();
  const accounts = useAccounts();
  const primaryAccount = accounts && accounts.length > 0 ? accounts[0] : undefined;

  const principalText = useMemo(() => {
    if (!identity) {
      return "Not connected";
    }
    return identity.getPrincipal().toString();
  }, [identity]);

  const accountId = useMemo(() => {
    if (!primaryAccount) {
      return "Not connected";
    }
    return deriveAccountId(primaryAccount.principal, primaryAccount.subAccount);
  }, [primaryAccount]);

  const walletLabel = useMemo(() => {
    if (!identity) {
      return "Not connected";
    }
    const principal = identity.getPrincipal().toString();
    if (principal.length <= 12) {
      return principal;
    }
    return `${principal.slice(0, 5)}...${principal.slice(-3)}`;
  }, [identity]);

  return { accountId, principalText, walletLabel };
}
