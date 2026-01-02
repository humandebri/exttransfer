"use client";

// app/providers.tsx: アプリ全体のウォレット/Canister状態を共有するためのプロバイダを定義。
import type { ReactNode } from "react";
import dynamic from "next/dynamic";

import { CanisterProvider } from "@/components/ext-transfer/canister-store";

type ProvidersProps = {
  children: ReactNode;
};

const Connect2ICBridge = dynamic(() => import("./connect2ic-bridge"), {
  ssr: false,
});

export default function Providers({ children }: ProvidersProps) {
  return (
    <CanisterProvider>
      <Connect2ICBridge>{children}</Connect2ICBridge>
    </CanisterProvider>
  );
}
