// lib/ic-account.ts: Helpers to derive ICP account identifiers for UI display and EXT calls.
import { sha224 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
import * as crc32 from "crc-32";
import { Principal } from "@dfinity/principal";

const DOMAIN_SEPARATOR = "account-id";
const SUBACCOUNT_LENGTH = 32;

export function deriveAccountId(
  principal: Principal,
  subAccount?: unknown
): string {
  const padding = new Uint8Array(1 + DOMAIN_SEPARATOR.length);
  padding[0] = 0x0a;
  padding.set(new TextEncoder().encode(DOMAIN_SEPARATOR), 1);

  const principalBytes = principal.toUint8Array();
  const subAccountBytes = normalizeSubAccount(subAccount);

  const data = new Uint8Array(
    padding.length + principalBytes.length + subAccountBytes.length
  );
  data.set(padding, 0);
  data.set(principalBytes, padding.length);
  data.set(subAccountBytes, padding.length + principalBytes.length);

  const hash = sha224(data);
  const checksum = crc32.buf(hash) >>> 0;
  const checksumBytes = new Uint8Array(4);
  checksumBytes[0] = (checksum >>> 24) & 0xff;
  checksumBytes[1] = (checksum >>> 16) & 0xff;
  checksumBytes[2] = (checksum >>> 8) & 0xff;
  checksumBytes[3] = checksum & 0xff;

  return `${bytesToHex(checksumBytes)}${bytesToHex(hash)}`;
}

function normalizeSubAccount(value: unknown): Uint8Array {
  if (value instanceof Uint8Array && value.length === SUBACCOUNT_LENGTH) {
    return value;
  }
  if (Array.isArray(value)) {
    const bytes = new Uint8Array(SUBACCOUNT_LENGTH);
    for (let i = 0; i < Math.min(value.length, SUBACCOUNT_LENGTH); i += 1) {
      const byte = value[i];
      if (typeof byte === "number" && Number.isInteger(byte)) {
        bytes[i] = byte;
      }
    }
    return bytes;
  }
  return new Uint8Array(SUBACCOUNT_LENGTH);
}
