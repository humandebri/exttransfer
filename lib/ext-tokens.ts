// lib/ext-tokens.ts: Minimal tokens_ext caller with safe decoding fallbacks.
import { IDL } from "@dfinity/candid";
import type { Agent } from "@dfinity/agent";

export type TokensExtResult =
  | { kind: "tokenIdentifiers"; tokens: string[] }
  | { kind: "indexes"; indexes: bigint[] }
  | { kind: "unknown"; reason: string };

export async function fetchTokensExt(
  agent: Agent,
  canisterId: string,
  accountId: string
): Promise<TokensExtResult> {
  const arg = IDL.encode([IDL.Text], [accountId]);
  const response = await agent.query(canisterId, {
    methodName: "tokens_ext",
    arg,
  });

  if (!response || response.status !== "replied" || !response.reply) {
    return { kind: "unknown", reason: "Query rejected" };
  }

  const raw = response.reply.arg;
  if (!isArrayBuffer(raw)) {
    return { kind: "unknown", reason: "Invalid response" };
  }

  const bytes = new Uint8Array(raw);

  const tokens = decodeTokenIdentifiers(bytes);
  if (tokens) {
    return { kind: "tokenIdentifiers", tokens };
  }

  const indexes = decodeTokenIndexes(bytes);
  if (indexes) {
    return { kind: "indexes", indexes };
  }

  return { kind: "unknown", reason: "Unsupported tokens_ext response" };
}

function decodeTokenIdentifiers(bytes: Uint8Array): string[] | null {
  const decoded = IDL.decode([IDL.Vec(IDL.Text)], bytes);
  if (!Array.isArray(decoded) || decoded.length === 0) {
    return null;
  }
  const value = decoded[0];
  return isStringArray(value) ? value : null;
}

function decodeTokenIndexes(bytes: Uint8Array): bigint[] | null {
  const decoded = IDL.decode([IDL.Vec(IDL.Nat32)], bytes);
  if (!Array.isArray(decoded) || decoded.length === 0) {
    return null;
  }
  const value = decoded[0];
  if (!Array.isArray(value)) {
    return null;
  }
  const indexes: bigint[] = [];
  for (const item of value) {
    if (typeof item === "bigint") {
      indexes.push(item);
      continue;
    }
    if (typeof item === "number" && Number.isInteger(item)) {
      indexes.push(BigInt(item));
      continue;
    }
    return null;
  }
  return indexes;
}

function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return value instanceof ArrayBuffer;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
