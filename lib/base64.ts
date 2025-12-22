// lib/base64.ts: クライアント側で使うBase64変換。OISYのサブアカウント処理に必要。
const CHUNK_SIZE = 0x8000;

export function base64ToUint8Array(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function uint8ArrayToBase64(value: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    const chunk = value.slice(i, i + CHUNK_SIZE);
    let chunkText = "";
    for (let j = 0; j < chunk.length; j += 1) {
      chunkText += String.fromCharCode(chunk[j]);
    }
    binary += chunkText;
  }
  return btoa(binary);
}
