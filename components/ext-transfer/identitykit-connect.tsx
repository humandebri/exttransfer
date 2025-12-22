"use client";

// components/ext-transfer/identitykit-connect.tsx: IdentityKit connect UI styled to match shadcn buttons.
import {
  ConnectWallet,
  type ConnectedWalletButtonProps,
  type ConnectWalletButtonProps,
} from "@nfid/identitykit/react";

import { Button } from "@/components/ui/button";

function formatAccountLabel(account: string) {
  if (account.length <= 10) {
    return account;
  }
  return `${account.slice(0, 6)}...${account.slice(-4)}`;
}

function ConnectButton({ className, disabled, loading, ...props }: ConnectWalletButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      className={`rounded-full ${className ?? ""}`}
      disabled={disabled || loading}
      {...props}
    >
      Connect wallet
    </Button>
  );
}

function ConnectedButton({
  className,
  connectedAccount,
  icpBalance,
  ...props
}: ConnectedWalletButtonProps) {
  void icpBalance;
  return (
    <Button
      type="button"
      variant="secondary"
      className={`rounded-full ${className ?? ""}`}
      {...props}
    >
      {`Wallet ${formatAccountLabel(connectedAccount)}`}
    </Button>
  );
}

export default function IdentityKitConnect() {
  return (
    <ConnectWallet
      connectButtonComponent={ConnectButton}
      connectedButtonComponent={ConnectedButton}
    />
  );
}
