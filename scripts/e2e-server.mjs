import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wrangler = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");
const config = path.join(root, "wrangler.e2e.jsonc");
const fixture = path.join(root, "tests", "e2e", "fixture.sql");
const persistenceRoot = path.join(root, ".wrangler", "e2e-state");
// 起動のたびに空のディレクトリを使う。前回の workerd が sqlite を掴んだままでも、
// 共有ディレクトリの削除失敗で今回の起動が止まらないようにする。
const persistence = path.join(persistenceRoot, `run-${process.pid}-${Date.now()}`);
await mkdir(persistence, { recursive: true });
await removeUnlocked(persistenceRoot, persistence);
const childEnv = {
  ...process.env,
  CI: "1",
  WRANGLER_WRITE_LOGS: "false",
};

function runWrangler(args) {
  const result = spawnSync(process.execPath, [wrangler, ...args], {
    cwd: root,
    env: childEnv,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`WranglerのE2E準備に失敗しました（終了コード ${result.status ?? "不明"}）`);
  }
}

function isFileLock(error) {
  const code = error && typeof error === "object" ? error.code : "";
  return code === "EPERM" || code === "EBUSY" || code === "ENOTEMPTY" || code === "EACCES";
}

/** ロックされていない前回分だけ消す。使用中のディレクトリは警告して次へ進む。 */
async function removeUnlocked(parent, current) {
  let names = [];
  try {
    names = await readdir(parent);
  } catch (error) {
    if (error && error.code === "ENOENT") return;
    throw error;
  }
  for (const name of names) {
    const target = path.join(parent, name);
    if (target === current) continue;
    try {
      await rm(target, { recursive: true, force: true, maxRetries: 2, retryDelay: 100 });
    } catch (error) {
      if (!isFileLock(error)) throw error;
      console.warn(`前回のE2E状態を削除できませんでした。今回のテストは別ディレクトリで続行します: ${target}`);
    }
  }
}

function stopServer(server) {
  if (!server?.pid || server.exitCode != null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  server.kill();
}

let server;
let closing = false;
async function close(exitCode = 0) {
  if (closing) return;
  closing = true;
  stopServer(server);
  try {
    await rm(persistence, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch (error) {
    if (!isFileLock(error)) throw error;
    console.warn(`今回のE2E状態を削除できませんでした。次回起動は別ディレクトリを使います: ${persistence}`);
  }
  process.exit(exitCode);
}

try {
  runWrangler([
    "d1", "migrations", "apply", "DB", "--local", "--persist-to", persistence,
    "--config", config,
  ]);
  runWrangler([
    "d1", "execute", "DB", "--local", "--persist-to", persistence,
    "--config", config, "--file", fixture, "--yes",
  ]);

  const variables = [
    "ADMIN_PASSWORD:e2e-admin-password",
    "ADMIN_USER_ID:9f0cdb75-82dd-4d4e-b7b7-97f7e1ea8c44",
    "MEMBER_PASSWORD:e2e-member-password",
    "SESSION_SECRET:e2e-session-secret-with-sufficient-length",
  ];
  const args = [
    wrangler,
    "dev",
    "--local",
    "--port", "8795",
    "--persist-to", persistence,
    "--config", config,
    "--log-level", "warn",
    "--show-interactive-dev-session=false",
  ];
  for (const variable of variables) args.push("--var", variable);
  server = spawn(process.execPath, args, {
    cwd: root,
    env: childEnv,
    stdio: "inherit",
  });
  server.on("exit", (code) => close(code ?? 1));
  process.on("SIGINT", () => close(0));
  process.on("SIGTERM", () => close(0));
} catch (error) {
  console.error(error);
  await close(1);
}
