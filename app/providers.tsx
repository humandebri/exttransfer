"use client";

// app/providers.tsx: App-level providers for wallet auth, keeping identity state outside feature views.
import type { ReactNode } from "react";
import { IdentityKitProvider } from "@nfid/identitykit/react";
import { IdentityKitAuthType, OISY, Stoic } from "@nfid/identitykit";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <IdentityKitProvider
      authType={IdentityKitAuthType.ACCOUNTS}
      signers={[Stoic, OISY]}
      discoverExtensionSigners
    >
      {children}
    </IdentityKitProvider>
  );
}
