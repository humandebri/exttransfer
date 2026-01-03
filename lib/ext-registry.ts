// lib/ext-registry.ts: EXT getRegistry caller to map TokenIndex -> AccountIdentifier.
import { IDL } from "@dfinity/candid";
import type { Agent } from "@dfinity/agent";

export type RegistryEntry = {
  tokenIndex: number;
  accountId: string;
};

export async function fetchRegistry(
  agent: Agent,
  canisterId: string
): Promise<RegistryEntry[]> {
  const arg = IDL.encode([], []);
  const response = await agent.query(canisterId, {
    methodName: "getRegistry",
    arg,
  });

  if (!response || response.status !== "replied" || !response.reply) {
    return [];
  }

  const raw = normalizeReplyArg(response.reply.arg);
  if (!raw) {
    return [];
  }

  const decoded = decodeRegistry(raw);

  if (!Array.isArray(decoded) || decoded.length === 0) {
    return [];
  }

  const entries = decoded[0];
  if (!Array.isArray(entries)) {
    return [];
  }

  const result: RegistryEntry[] = [];
  for (const entry of entries) {
    const normalized = normalizeRegistryEntry(entry);
    if (!normalized) {
      continue;
    }
    result.push(normalized);
  }

  return result;
}

function decodeRegistry(raw: Uint8Array): unknown {
  return IDL.decode([IDL.Vec(IDL.Tuple(IDL.Nat32, IDL.Text))], raw);
}

function normalizeRegistryEntry(value: unknown): RegistryEntry | null {
  if (Array.isArray(value) && value.length >= 2) {
    return buildRegistryEntry(value[0], value[1]);
  }
  return null;
}

function buildRegistryEntry(
  indexValue: unknown,
  accountValue: unknown
): RegistryEntry | null {
  if (typeof accountValue !== "string") {
    return null;
  }
  const numericIndex = normalizeRegistryIndex(indexValue);
  if (numericIndex === null) {
    return null;
  }
  return { tokenIndex: numericIndex, accountId: accountValue };
}

function normalizeRegistryIndex(value: unknown): number | null {
  if (typeof value === "bigint") {
    return Number.isSafeInteger(value) ? Number(value) : null;
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? value : null;
  }
  return null;
}


function normalizeReplyArg(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) {
    return value;
  }
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  return null;
}

function getReplyByteLength(value: unknown): number | null {
  if (value instanceof Uint8Array) {
    return value.byteLength;
  }
  if (value instanceof ArrayBuffer) {
    return value.byteLength;
  }
  return null;
}
