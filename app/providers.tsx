"use client";

// app/providers.tsx: アプリ全体のウォレット状態を共有するためのプロバイダを定義。
import type { ReactNode } from "react";

import { WalletProvider } from "@/components/ext-transfer/wallet-context";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return <WalletProvider>{children}</WalletProvider>;
}
