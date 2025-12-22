// types/ic-stoic-identity.d.ts: Stoic Identityの型定義。未提供の型を補完して安全に利用する。
declare module "ic-stoic-identity" {
  import type { SignIdentity } from "@dfinity/agent";
  import type { Principal } from "@dfinity/principal";

  export type StoicTransport = "popup" | "iframe";

  export class StoicIdentity extends SignIdentity {
    static connect(
      providerUrl?: string,
      transport?: StoicTransport
    ): Promise<StoicIdentity>;
    static load(
      providerUrl?: string,
      transport?: StoicTransport
    ): Promise<StoicIdentity | false>;
    static disconnect(): void;
    getPrincipal(): Principal;
  }
}
