// lib/ext-token-id.ts: TokenIdentifier helpers for EXT-style token id construction.
import { Principal } from "@dfinity/principal";

const DOMAIN_SEPARATOR = "tid";
const TOKEN_INDEX_BYTES = 4;

export function tokenIdentifierFromIndex(
  canisterId: string,
  tokenIndex: number
): string {
  const principalBytes = Principal.fromText(canisterId).toUint8Array();
  const domainBytes = new Uint8Array(1 + DOMAIN_SEPARATOR.length);
  domainBytes[0] = 0x0a;
  domainBytes.set(new TextEncoder().encode(DOMAIN_SEPARATOR), 1);

  const indexBytes = new Uint8Array(TOKEN_INDEX_BYTES);
  indexBytes[0] = (tokenIndex >>> 24) & 0xff;
  indexBytes[1] = (tokenIndex >>> 16) & 0xff;
  indexBytes[2] = (tokenIndex >>> 8) & 0xff;
  indexBytes[3] = tokenIndex & 0xff;

  const data = new Uint8Array(
    domainBytes.length + principalBytes.length + indexBytes.length
  );
  data.set(domainBytes, 0);
  data.set(principalBytes, domainBytes.length);
  data.set(indexBytes, domainBytes.length + principalBytes.length);

  return Principal.fromUint8Array(data).toText();
}
