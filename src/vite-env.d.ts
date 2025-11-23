/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_CHAT_API_BASE_URL?: string;
  readonly VITE_CHAT_API_TOKEN?: string;
  readonly VITE_CHAT_POLL_INTERVAL?: string;
  readonly VITE_CHAT_PAGE_LIMIT?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
