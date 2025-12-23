// lib/ext-owned-tokens.ts: EXT tokens(accountId) caller to list owned token indexes.
import { IDL } from "@dfinity/candid";
import type { Agent } from "@dfinity/agent";

export type TokensResult =
  | { kind: "ok"; indexes: number[] }
  | { kind: "err"; message: string };

export async function fetchOwnedTokenIndexes(
  agent: Agent,
  canisterId: string,
  accountId: string
): Promise<TokensResult> {
  console.info("[exttransfer] tokens query", {
    canisterId,
    accountId,
  });
  const arg = IDL.encode([IDL.Text], [accountId]);
  const response = await agent.query(canisterId, {
    methodName: "tokens",
    arg,
  });

  if (!response || response.status !== "replied" || !response.reply) {
    return { kind: "err", message: "Query rejected" };
  }

  const raw = response.reply.arg;
  if (!raw || typeof raw !== "object") {
    return { kind: "err", message: "Invalid response" };
  }

  const bytes =
    raw instanceof Uint8Array
      ? raw
      : raw instanceof ArrayBuffer
        ? new Uint8Array(raw)
        : null;
  if (!bytes) {
    return { kind: "err", message: "Invalid response" };
  }
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  );
  const decoded = IDL.decode(
    [
      IDL.Variant({
        ok: IDL.Vec(IDL.Nat32),
        err: IDL.Variant({
          InvalidToken: IDL.Text,
          Other: IDL.Text,
        }),
      }),
    ],
    buffer
  );

  if (!Array.isArray(decoded) || decoded.length === 0) {
    return { kind: "err", message: "Decode failed" };
  }

  const value = decoded[0];
  console.info("[exttransfer] tokens decoded", value);
  if (value && typeof value === "object" && "ok" in value) {
    const indexes = normalizeIndexes(value.ok);
    return { kind: "ok", indexes };
  }

  if (value && typeof value === "object" && "err" in value) {
    const errValue = value.err;
    const message =
      errValue && typeof errValue === "object"
        ? "InvalidToken" in errValue && typeof errValue.InvalidToken === "string"
          ? errValue.InvalidToken
          : "Other" in errValue && typeof errValue.Other === "string"
            ? errValue.Other
            : "Unknown error"
        : "Unknown error";
    return {
      kind: "err",
      message,
    };
  }

  return { kind: "err", message: "Unexpected response" };
}

function normalizeIndexes(value: unknown): number[] {
  const iterable: unknown[] = [];
  if (Array.isArray(value)) {
    iterable.push(...value);
  } else if (value instanceof Uint32Array) {
    iterable.push(...value);
  }
  if (iterable.length === 0) {
    return [];
  }
  const result: number[] = [];
  for (const item of iterable) {
    if (typeof item === "number" && Number.isInteger(item)) {
      result.push(item);
      continue;
    }
    if (typeof item === "bigint") {
      const numeric = Number(item);
      if (Number.isInteger(numeric)) {
        result.push(numeric);
      }
    }
  }
  return result;
}
