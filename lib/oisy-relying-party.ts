// lib/oisy-relying-party.ts: OISYのRelyingPartyを拡張し、dApp側からICRC-49呼び出しを行うため。
import { RelyingParty } from "@dfinity/oisy-wallet-signer/relying-party";
import type {
  IcrcCallCanisterRequestParams,
  IcrcCallCanisterResult,
  RelyingPartyOptions,
  RelyingPartyRequestOptions,
} from "@dfinity/oisy-wallet-signer";

export class OisyRelyingParty extends RelyingParty {
  static async connect(options: RelyingPartyOptions): Promise<OisyRelyingParty> {
    return this.connectSigner({
      options,
      init: (params) => new OisyRelyingParty(params),
    });
  }

  callCanister(params: {
    params: IcrcCallCanisterRequestParams;
    options?: RelyingPartyRequestOptions;
  }): Promise<IcrcCallCanisterResult> {
    return this.call(params);
  }
}
