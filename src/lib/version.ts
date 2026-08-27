/**
 * アプリ版の単一ソース。package.json の version を読む。
 * 表示は appVersionLabel()（例: v0.2.0）。上げるときは package.json だけ。
 */
import { version as packageVersion } from "../../package.json";

export const APP_VERSION: string = packageVersion;

export function appVersionLabel(): string {
  return `v${APP_VERSION}`;
}
