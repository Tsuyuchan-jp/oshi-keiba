/** Wrangler secret / vars。生成 Env に無い分だけ足す（宣言マージ） */
interface Env {
  SESSION_SECRET: string;
  MEMBER_PASSWORD: string;
  ALLOW_DEMO_RESET?: string;
  SHOTS?: R2Bucket;
}

declare module "*.json" {
  const value: { skills: { name: string; kind: string }[] };
  export default value;
}
