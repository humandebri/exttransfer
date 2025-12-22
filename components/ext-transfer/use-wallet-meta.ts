"use client";

// components/ext-transfer/use-wallet-meta.ts: 画面表示で使うウォレット情報を整形して返す。
import { useMemo } from "react";

import { useWallets } from "@/components/ext-transfer/wallet-context";

export type WalletMeta = {
  accountId: string;
  principalText: string;
  walletLabel: string;
};

export function useWalletMeta(): WalletMeta {
  const { activeWallet } = useWallets();

  const principalText = useMemo(() => {
    if (!activeWallet || !activeWallet.principalText) {
      return "Not connected";
    }
    return activeWallet.principalText;
  }, [activeWallet]);

  const accountId = useMemo(() => {
    if (!activeWallet || !activeWallet.accountId) {
      return "Not connected";
    }
    return activeWallet.accountId;
  }, [activeWallet]);

  const walletLabel = useMemo(() => {
    if (!activeWallet || !activeWallet.principalText) {
      return "Not connected";
    }
    const principal = activeWallet.principalText;
    if (principal.length <= 12) {
      return principal;
    }
    return `${principal.slice(0, 5)}...${principal.slice(-3)}`;
  }, [activeWallet]);

  return { accountId, principalText, walletLabel };
}
