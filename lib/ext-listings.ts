// lib/ext-listings.ts: selected canister の listings を query して価格情報を取り出す。
import { IDL } from "@dfinity/candid";
import type { Agent } from "@dfinity/agent";

export type ListingCurrency = {
  symbol: string;
  decimals: number;
};

export type ListingInfo = {
  tokenIndex: number;
  price: bigint;
  sellerFrontend: string | null;
  buyerFrontend: string | null;
  currency: ListingCurrency | null;
};

export type ListingsResult =
  | { kind: "ok"; listings: ListingInfo[] }
  | { kind: "err"; message: string };

export async function fetchListings(
  agent: Agent,
  canisterId: string
): Promise<ListingsResult> {
  const arg = IDL.encode([], []);
  const response = await agent.query(canisterId, {
    methodName: "listings",
    arg,
  });

  if (!response || response.status !== "replied" || !response.reply) {
    return { kind: "err", message: "Query rejected" };
  }

  const raw = response.reply.arg;
  const bytes = toUint8Array(raw);
  if (!bytes) {
    return { kind: "err", message: "Invalid response" };
  }

  const buffer = sliceToArrayBuffer(bytes);

  const listingData = IDL.Record({
    sellerFrontend: IDL.Opt(IDL.Text),
    locked: IDL.Opt(IDL.Int),
    seller: IDL.Principal,
    buyerFrontend: IDL.Opt(IDL.Text),
    price: IDL.Nat64,
  });
  const tokenVariant = IDL.Variant({
    fungible: IDL.Record({
      decimals: IDL.Nat8,
      metadata: IDL.Opt(IDL.Vec(IDL.Nat8)),
      name: IDL.Text,
      symbol: IDL.Text,
    }),
    nonfungible: IDL.Record({
      metadata: IDL.Opt(IDL.Vec(IDL.Nat8)),
    }),
  });
  const listingTuple = IDL.Tuple(IDL.Nat32, listingData, tokenVariant);
  const listingRecord = IDL.Record({
    0: IDL.Nat32,
    1: listingData,
    2: tokenVariant,
  });

  const decoded = decodeListings(buffer, listingTuple, listingRecord);
  if (!Array.isArray(decoded) || decoded.length === 0) {
    return { kind: "err", message: "Decode failed" };
  }

  const listingsRaw = decoded[0];
  if (!Array.isArray(listingsRaw)) {
    return { kind: "err", message: "Invalid response" };
  }

  const listings: ListingInfo[] = [];
  for (const entry of listingsRaw) {
    const parsed = parseListingEntry(entry);
    if (parsed) {
      listings.push(parsed);
    }
  }

  return { kind: "ok", listings };
}

function parseListingEntry(value: unknown): ListingInfo | null {
  let tokenIndexValue: unknown;
  let listing: unknown;
  let tokenType: unknown;
  if (Array.isArray(value)) {
    tokenIndexValue = value[0];
    listing = value[1];
    tokenType = value[2];
  } else if (isRecord(value)) {
    tokenIndexValue = value["0"];
    listing = value["1"];
    tokenType = value["2"];
  } else {
    return null;
  }

  const tokenIndex = toNumber(tokenIndexValue);
  if (tokenIndex === null || !isRecord(listing)) {
    return null;
  }

  const price = toBigInt(listing.price);
  if (price === null) {
    return null;
  }

  const sellerFrontend = unwrapOptText(listing.sellerFrontend);
  const buyerFrontend = unwrapOptText(listing.buyerFrontend);
  const currency = parseCurrency(tokenType);

  return {
    tokenIndex,
    price,
    sellerFrontend,
    buyerFrontend,
    currency,
  };
}

function parseCurrency(value: unknown): ListingCurrency | null {
  if (!isRecord(value) || !("fungible" in value)) {
    return null;
  }
  const fungible = value.fungible;
  if (!isRecord(fungible)) {
    return null;
  }
  const decimals = toNumber(fungible.decimals);
  const symbol = typeof fungible.symbol === "string" ? fungible.symbol : null;
  if (decimals === null || symbol === null) {
    return null;
  }
  return { decimals, symbol };
}

function toUint8Array(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) {
    return value;
  }
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  return null;
}

function sliceToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  // SharedArrayBufferを確実にArrayBufferへ変換してIDL.decodeへ渡す。
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function unwrapOptText(value: unknown): string | null {
  if (Array.isArray(value) && value.length === 1 && typeof value[0] === "string") {
    return value[0];
  }
  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === "bigint") {
    const numeric = Number(value);
    if (Number.isInteger(numeric)) {
      return numeric;
    }
  }
  return null;
}

function toBigInt(value: unknown): bigint | null {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number" && Number.isInteger(value)) {
    return BigInt(value);
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function decodeListings(
  buffer: ArrayBuffer,
  tupleShape: IDL.Type,
  recordShape: IDL.Type
): unknown {
  try {
    return IDL.decode([IDL.Vec(tupleShape)], buffer);
  } catch (error) {
    console.warn("[exttransfer] listings tuple decode failed", error);
  }
  try {
    return IDL.decode([IDL.Vec(recordShape)], buffer);
  } catch (error) {
    console.warn("[exttransfer] listings record decode failed", error);
  }
  return [];
}
