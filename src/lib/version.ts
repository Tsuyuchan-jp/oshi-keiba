/**
 * アプリ版の単一ソース。package.json の version を読む。
 * 表示は appVersionLabel()（例: v0.3.0）。版上げ時は package.json と
 * docs/history/changelog.md を同じ変更で更新する。
 */
import { version as packageVersion } from "../../package.json";

export const APP_VERSION: string = packageVersion;

export function appVersionLabel(): string {
  return `v${APP_VERSION}`;
}
