// @ts-nocheck
// lib/astrox-me-connector.ts: AstroX MEをWebView/通常ブラウザで切替接続するカスタムコネクタ。
import { PermissionsType } from "@astrox/connection/lib/esm/types";
import type { Wallet } from "@astrox/sdk-core";
import { IC } from "@astrox/sdk-web";
import { AstroXWebViewHandler } from "@astrox/sdk-webview";
import type { IDL } from "@dfinity/candid";
import type { ActorSubclass, Identity, SignIdentity } from "@dfinity/agent";
import { ok, err, type Result } from "neverthrow";

type AstroXConfig = {
  whitelist: string[];
  providerUrl: string;
  host: string;
  customDomain: string;
  dev?: boolean;
};

enum InitError {
  InitFailed = "INIT_FAILED",
}

enum ConnectError {
  NotInitialized = "NOT_INITIALIZED",
  ConnectFailed = "CONNECT_FAILED",
}

enum DisconnectError {
  DisconnectFailed = "DISCONNECT_FAILED",
  NotInitialized = "NOT_INITIALIZED",
}

enum CreateActorError {
  CreateActorFailed = "CREATE_ACTOR_FAILED",
  NotInitialized = "NOT_INITIALIZED",
}

type InitResult = Result<{ isConnected: boolean }, { kind: InitError; message?: string }>;
type ConnectResult = Result<boolean, { kind: ConnectError; message?: string }>;
type DisconnectResult = Result<boolean, { kind: DisconnectError; message?: string }>;
type CreateActorResult<Service> = Result<
  ActorSubclass<Service>,
  { kind: CreateActorError; message?: string }
>;

const MAX_DELEGATION_TARGETS = 900;
const SEVEN_DAYS_NS = BigInt(7 * 24 * 60 * 60 * 1_000_000_000);
const PLACEHOLDER_ICON = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

declare global {
  interface Window {
    astrox_webview?: unknown;
  }
}

const isMeWebview = (): boolean => {
  return typeof window !== "undefined" && Boolean(window.astrox_webview);
};

const toMessage = (error: unknown): string | undefined => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return undefined;
};

export class AstroXMeConnector {
  private internalConfig: AstroXConfig & { dev: boolean };
  private webview = new AstroXWebViewHandler();
  private ic: IC | null = null;
  private identity: unknown;
  private principalText: string | undefined;
  private wallet: Wallet | null = null;

  public meta = {
    features: ["wallet"],
    icon: { light: PLACEHOLDER_ICON, dark: PLACEHOLDER_ICON },
    id: "astrox",
    name: "AstroX ME",
  };

  constructor(config: AstroXConfig) {
    this.internalConfig = { ...config, dev: config.dev ?? false };
  }

  get principal() {
    return this.principalText;
  }

  get wallets() {
    return this.wallet ? [this.wallet] : [];
  }

  getWallet(): Wallet | null {
    return this.wallet;
  }

  get config() {
    return this.internalConfig;
  }

  set config(next: AstroXConfig & { dev: boolean }) {
    this.internalConfig = next;
  }

  private sanitizedDelegationTargets(): string[] {
    const unique = Array.from(new Set(this.internalConfig.whitelist.map((value) => value.trim()).filter(Boolean)));
    return unique.slice(0, MAX_DELEGATION_TARGETS);
  }

  private updateFromWebview(): void {
    try {
      const wallet = this.webview.wallet;
      this.wallet = wallet ?? null;
      this.identity = this.webview.identity;
      this.principalText =
        this.webview.getPrincipal()?.toString() ?? wallet?.principal ?? this.principalText ?? undefined;
    } catch {
      this.wallet = null;
    }
  }

  private updateFromIC(): void {
    if (!this.ic) {
      return;
    }
    this.identity = this.ic.identity;
    this.principalText = this.ic.principal?.toText?.() ?? this.principalText;
    this.wallet = this.ic.wallet ?? null;
  }

  async init(): Promise<InitResult> {
    if (isMeWebview()) {
      try {
        await this.webview.init();
        const connected = await this.webview.isConnected();
        if (connected) {
          this.updateFromWebview();
        }
        return ok({ isConnected: connected });
      } catch (error) {
        return err({ kind: InitError.InitFailed, message: toMessage(error) });
      }
    }

    try {
      this.ic = await IC.create({
        useFrame: !(window.innerWidth < 768),
        signerProviderUrl: `${this.internalConfig.providerUrl}/#signer`,
        walletProviderUrl: `${this.internalConfig.providerUrl}/#transaction`,
        identityProvider: `${this.internalConfig.providerUrl}/#authorize`,
        permissions: [PermissionsType.identity, PermissionsType.wallet],
        host: this.internalConfig.host,
        dev: this.internalConfig.dev,
        delegationTargets: this.sanitizedDelegationTargets(),
        customDomain: this.internalConfig.customDomain || window.location.origin,
        maxTimeToLive: SEVEN_DAYS_NS,
      });
      const connected = await this.ic.isAuthenticated();
      if (connected) {
        this.updateFromIC();
      }
      return ok({ isConnected: connected });
    } catch (error) {
      return err({ kind: InitError.InitFailed, message: toMessage(error) });
    }
  }

  async isConnected(): Promise<boolean> {
    if (isMeWebview()) {
      try {
        return await this.webview.isConnected();
      } catch {
        return false;
      }
    }
    return this.ic ? await this.ic.isAuthenticated() : false;
  }

  async connect(): Promise<ConnectResult> {
    if (await this.isConnected()) {
      return ok(true);
    }

    const delegationTargets = this.sanitizedDelegationTargets();
    const customDomain = this.internalConfig.customDomain || window.location.origin;

    if (isMeWebview()) {
      try {
        const connected = await this.webview.connect({
          delegationTargets,
          host: this.internalConfig.host,
          customDomain,
        });
        if (connected) {
          this.updateFromWebview();
        }
        return ok(connected);
      } catch (error) {
        return err({ kind: ConnectError.ConnectFailed, message: toMessage(error) });
      }
    }

    if (!this.ic) {
      return err({ kind: ConnectError.NotInitialized });
    }
    try {
      await this.ic.connect({
        useFrame: !(window.innerWidth < 768),
        signerProviderUrl: `${this.internalConfig.providerUrl}/#signer`,
        walletProviderUrl: `${this.internalConfig.providerUrl}/#transaction`,
        identityProvider: `${this.internalConfig.providerUrl}/#authorize`,
        permissions: [PermissionsType.identity, PermissionsType.wallet],
        host: this.internalConfig.host,
        dev: this.internalConfig.dev,
        delegationTargets,
        customDomain,
        delegationModes: ["global", "domain"],
        maxTimeToLive: SEVEN_DAYS_NS,
      });
      this.updateFromIC();
      return ok(true);
    } catch (error) {
      return err({ kind: ConnectError.ConnectFailed, message: toMessage(error) });
    }
  }

  async disconnect(): Promise<DisconnectResult> {
    if (isMeWebview()) {
      try {
        await this.webview.disconnect();
        this.identity = undefined;
        this.principalText = undefined;
        this.wallet = null;
        return ok(true);
      } catch (error) {
        return err({ kind: DisconnectError.DisconnectFailed, message: toMessage(error) });
      }
    }

    if (!this.ic) {
      return err({ kind: DisconnectError.NotInitialized });
    }
    try {
      await this.ic.disconnect();
      this.identity = undefined;
      this.principalText = undefined;
      this.wallet = null;
      return ok(true);
    } catch (error) {
      return err({ kind: DisconnectError.DisconnectFailed, message: toMessage(error) });
    }
  }

  async createActor<Service>(
    canisterId: string,
    interfaceFactory: IDL.InterfaceFactory
  ): Promise<CreateActorResult<Service>> {
    if (isMeWebview()) {
      try {
        const actor = await this.webview.createActor<Service>(canisterId, interfaceFactory);
        return ok(actor);
      } catch (error) {
        return err({ kind: CreateActorError.CreateActorFailed, message: toMessage(error) });
      }
    }

    if (!this.ic) {
      return err({ kind: CreateActorError.NotInitialized });
    }
    try {
      const actor = await this.ic.createActor<Service>(interfaceFactory, canisterId);
      return ok(actor);
    } catch (error) {
      return err({ kind: CreateActorError.CreateActorFailed, message: toMessage(error) });
    }
  }
}
