interface ViteTypeOptions {
  // この行を追加することで ImportMetaEnv の型を厳密にし、不明なキーを許可しないように
  // できます。
  // strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly AI_GATEWAY_API_KEY: string;
  readonly KV_REST_API_READ_ONLY_TOKEN: string;
  readonly KV_REST_API_TOKEN: string;
  readonly KV_REST_API_URL: string;
  readonly KV_URL: string;
  readonly REDIS_URL: string;
}
