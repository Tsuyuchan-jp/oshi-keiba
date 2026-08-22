/** Wrangler secret / vars。生成 Env に無い分だけ足す（宣言マージ） */
interface Env {
  SESSION_SECRET: string;
  MEMBER_PASSWORD: string;
}
