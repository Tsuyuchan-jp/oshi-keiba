/** Wrangler secret / vars。生成 Env に無い分だけ足す（宣言マージ） */
interface Env {
  ADMIN_PASSWORD: string;
  ADMIN_USER_ID: string;
  SESSION_SECRET: string;
  MEMBER_PASSWORD: string;
  ALLOW_DEMO_RESET?: string;
  ASSETS: Fetcher;
  SHOTS?: R2Bucket;
}

declare module "*.json" {
  const value: unknown;
  export default value;
}
