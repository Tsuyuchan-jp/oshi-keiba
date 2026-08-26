/**
 * node --test 用: 拡張子なし相対 import を .ts へ解決する
 * （Wrangler 向けソースをそのまま Node で読むため）
 */
import path from "node:path";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register(
  pathToFileURL(path.join(import.meta.dirname, "test-resolve-hook.mjs")).href,
);
