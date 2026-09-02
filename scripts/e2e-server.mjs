import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wrangler = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");
const config = path.join(root, "wrangler.e2e.jsonc");
const fixture = path.join(root, "tests", "e2e", "fixture.sql");
const persistence = path.join(root, ".wrangler", "e2e-state");
await rm(persistence, { recursive: true, force: true });
await mkdir(persistence, { recursive: true });
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

let server;
let closing = false;
async function close(exitCode = 0) {
  if (closing) return;
  closing = true;
  server?.kill();
  await rm(persistence, { recursive: true, force: true });
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
