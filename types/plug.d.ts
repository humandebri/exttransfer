// types/plug.d.ts: Plug拡張のWindow型定義。接続APIを安全に扱うために用意。
import type { HttpAgent } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";

export type PlugRequestConnectParams = {
  whitelist?: string[];
  host?: string;
  timeout?: number;
  onConnectionUpdate?: () => void;
};

export type PlugCreateActorParams = {
  canisterId: string;
  interfaceFactory: IDL.InterfaceFactory;
};

export type PlugCreateAgentParams = {
  whitelist: string[];
  host?: string;
};

export type PlugProvider = {
  requestConnect: (params?: PlugRequestConnectParams) => Promise<unknown>;
  isConnected: () => Promise<boolean>;
  disconnect: () => void;
  createAgent: (params: PlugCreateAgentParams) => Promise<void>;
  createActor: <T>(params: PlugCreateActorParams) => Promise<T>;
  onExternalDisconnect: (callback: () => void) => void;
  onLockStateChange: (callback: (isLocked: boolean) => void) => void;
  agent?: HttpAgent;
  principalId?: string;
  accountId?: string;
};

declare global {
  interface Window {
    ic?: {
      plug?: PlugProvider;
    };
  }
}

export {};
