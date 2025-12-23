// lib/ext-transfer-icrc.ts: OISYのICRC-49経由でEXT transferを呼ぶための変換とデコード。
import { IDL } from "@icp-sdk/core/candid";
import {
  AnonymousIdentity,
  Certificate,
  Cbor,
  Expiry,
  HttpAgent,
  JSON_KEY_EXPIRY,
  lookupResultToBuffer,
  requestIdOf,
} from "@icp-sdk/core/agent";
import { Principal as IcpPrincipal } from "@icp-sdk/core/principal";
import type {
  IcrcCallCanisterRequestParams,
  IcrcCallCanisterResult,
  RelyingPartyHost,
} from "@dfinity/oisy-wallet-signer";

import { base64ToUint8Array, uint8ArrayToBase64 } from "@/lib/base64";
import type { TransferError, TransferResponse } from "@/lib/ext-transfer";

export type OisyTransferTo =
  | { principal: IcpPrincipal }
  | { address: string };

export type OisyTransferFrom =
  | { principal: IcpPrincipal }
  | { address: string };

export type OisyTransferRequest = {
  to: OisyTransferTo;
  token: string;
  notify: boolean;
  from: OisyTransferFrom;
  memo: number[];
  subaccount: number[][];
  amount: bigint;
};

const transferIdl = (() => {
  const toVariant = IDL.Variant({
    principal: IDL.Principal,
    address: IDL.Text,
  });
  const fromVariant = IDL.Variant({
    principal: IDL.Principal,
    address: IDL.Text,
  });
  const errorVariant = IDL.Variant({
    CannotNotify: IDL.Text,
    InsufficientBalance: IDL.Null,
    InvalidToken: IDL.Text,
    Rejected: IDL.Null,
    Unauthorized: IDL.Text,
    Other: IDL.Text,
  });
  const request = IDL.Record({
    to: toVariant,
    token: IDL.Text,
    notify: IDL.Bool,
    from: fromVariant,
    memo: IDL.Vec(IDL.Nat8),
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    amount: IDL.Nat,
  });
  const response = IDL.Variant({ ok: IDL.Nat, err: errorVariant });
  return { request, response };
})();

type CallRequest = {
  request_type?: string;
  canister_id: IcpPrincipal;
  method_name: string;
  arg: Uint8Array;
  sender: IcpPrincipal;
  ingress_expiry: Expiry;
};

function toUint8Array(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) {
    return value;
  }
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  if (Array.isArray(value)) {
    return new Uint8Array(value);
  }
  throw new Error("Unsupported byte array value.");
}

function normalizeCborMap(value: unknown): Record<string, unknown> {
  if (value instanceof Map) {
    const record: Record<string, unknown> = {};
    value.forEach((entryValue, entryKey) => {
      record[String(entryKey)] = entryValue;
    });
    return record;
  }
  if (value && typeof value === "object") {
    const record: Record<string, unknown> = {};
    for (const [entryKey, entryValue] of Object.entries(value)) {
      record[entryKey] = entryValue;
    }
    return record;
  }
  throw new Error("Invalid CBOR map.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTransferError(value: unknown): value is TransferError {
  if (!isRecord(value)) {
    return false;
  }
  const errorKeys = [
    "CannotNotify",
    "InsufficientBalance",
    "InvalidToken",
    "Rejected",
    "Unauthorized",
    "Other",
  ];
  return errorKeys.some((key) => key in value);
}

function isTransferResponse(value: unknown): value is TransferResponse {
  if (!isRecord(value)) {
    return false;
  }
  if ("ok" in value) {
    return typeof value.ok === "bigint";
  }
  if ("err" in value) {
    return isTransferError(value.err);
  }
  return false;
}

function decodeCallRequest(contentMap: string): CallRequest {
  const decoded = Cbor.decode(base64ToUint8Array(contentMap));
  const record = normalizeCborMap(decoded);
  const canisterIdBytes = toUint8Array(record["canister_id"]);
  const senderBytes = toUint8Array(record["sender"]);
  const argBytes = toUint8Array(record["arg"]);
  const methodName = String(record["method_name"]);
  const requestType = record["request_type"]
    ? String(record["request_type"])
    : undefined;
  const ingressExpiryRaw = record["ingress_expiry"];
  const ingressExpiry = Expiry.fromJSON(
    JSON.stringify({
      [JSON_KEY_EXPIRY]:
        typeof ingressExpiryRaw === "bigint"
          ? ingressExpiryRaw.toString()
          : String(ingressExpiryRaw),
    })
  );

  return {
    request_type: requestType,
    canister_id: IcpPrincipal.fromUint8Array(canisterIdBytes),
    method_name: methodName,
    arg: argBytes,
    sender: IcpPrincipal.fromUint8Array(senderBytes),
    ingress_expiry: ingressExpiry,
  };
}

function encodeIdl<T>({
  recordClass,
  rawArgs,
}: {
  recordClass: IDL.RecordClass | IDL.VariantClass;
  rawArgs: T;
}): string {
  const bytes = IDL.encode([recordClass], [rawArgs]);
  return uint8ArrayToBase64(new Uint8Array(bytes));
}

export function buildOisyTransferCallParams(
  canisterId: string,
  sender: string,
  request: OisyTransferRequest
): IcrcCallCanisterRequestParams {
  return {
    canisterId,
    sender,
    method: "transfer",
    arg: encodeIdl({ recordClass: transferIdl.request, rawArgs: request }),
  };
}

export async function decodeOisyTransferResponse({
  params,
  result,
  host,
}: {
  params: IcrcCallCanisterRequestParams;
  result: IcrcCallCanisterResult;
  host?: RelyingPartyHost;
}): Promise<TransferResponse> {
  const request = decodeCallRequest(result.contentMap);
  const requestId = requestIdOf({
    request_type: request.request_type ?? "call",
    canister_id: request.canister_id,
    method_name: request.method_name,
    arg: request.arg,
    sender: request.sender,
    ingress_expiry: request.ingress_expiry,
  });
  const hostname = window.location.hostname;
  const shouldFetchRootKey =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost");
  const agent = new HttpAgent({
    identity: new AnonymousIdentity(),
    host: shouldFetchRootKey ? host ?? "http://localhost:4943" : "https://icp-api.io",
    shouldFetchRootKey,
  });
  if (shouldFetchRootKey) {
    await agent.fetchRootKey();
  }
  const rootKey = agent.rootKey;
  if (!rootKey) {
    throw new Error("Missing root key for certificate verification.");
  }
  const certificate = await Certificate.create({
    certificate: base64ToUint8Array(result.certificate),
    rootKey,
    principal: { canisterId: IcpPrincipal.fromText(params.canisterId) },
    agent,
  });
  const path = [
    new TextEncoder().encode("request_status"),
    requestId,
    "reply",
  ];
  const reply = lookupResultToBuffer(certificate.lookup_path(path));
  if (!reply) {
    throw new Error("No reply found in certificate.");
  }
  const decoded = IDL.decode([transferIdl.response], reply);
  if (decoded.length !== 1) {
    throw new Error("Unexpected response shape.");
  }
  const [response] = decoded;
  if (!isTransferResponse(response)) {
    throw new Error("Invalid transfer response.");
  }
  return response;
}

export type OisyTransferError = TransferError;
