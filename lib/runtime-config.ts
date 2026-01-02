// lib/runtime-config.ts: IC接続先やウォレット連携に必要なURLを集約する。

export const IC_HOST = "https://icp-api.io";
export const PLUG_HOST = "https://ic0.app";
export const OISY_SIGNER_URL = "https://oisy.com/sign";
export const STOIC_WALLET_URL = "https://www.stoicwallet.com";
export const STOIC_TRANSPORT = "popup";
export const TRANSFER_TIMEOUT_MS = 30000;
// トークン数取得は並列数を抑えてクエリ負荷を軽減する。
export const TOKEN_COUNT_CONCURRENCY = 4;
export const ASTROX_DEV = false;
export const ASTROX_PROVIDER_URL = "https://zwbmf-zyaaa-aaaai-acjaq-cai.ic0.app";
export const ASTROX_LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
export const ASTROX_LEDGER_HOST = "https://boundary.ic0.app/";
