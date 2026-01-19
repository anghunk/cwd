export type Bindings = {
  CWD_DB: D1Database
  CWD_AUTH_KV: KVNamespace;
  ALLOW_ORIGIN: string
  CF_FROM_EMAIL?: string
  SEND_EMAIL?: {
    send: (message: any) => Promise<any>
  } 
  ADMIN_NAME: string
  ADMIN_PASSWORD: string
}
