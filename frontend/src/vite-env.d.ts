/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string
  readonly VITE_INSTAGRAM_APP_ID?: string
  readonly VITE_INSTAGRAM_REDIRECT_URI?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
