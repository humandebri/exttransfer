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
export const ASTROX_PROVIDER_URLS = [
  // ME公式エンドポイント。signer/authorize/transactionはこのベースURLに付与される。
  "https://63k2f-nyaaa-aaaah-aakla-cai.raw.ic0.app",
];
export const ASTROX_PROVIDER_URL = ASTROX_PROVIDER_URLS[0];
// customDomainはME側でDApp識別に使われるため、必ず自分の配信ドメインを設定する。
// NEXT_PUBLIC_APP_ORIGINが未設定の場合は実行時にwindow.location.originへフォールバックする。
export const ASTROX_CUSTOM_DOMAIN = process.env.NEXT_PUBLIC_APP_ORIGIN ?? "";
