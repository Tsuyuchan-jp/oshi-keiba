import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

function tryFile(base) {
  for (const ext of [".ts", ".js", ".mjs", ".json"]) {
    const p = base + ext;
    if (fs.existsSync(p)) return p;
  }
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !path.extname(specifier)
  ) {
    const parent = context.parentURL
      ? path.dirname(fileURLToPath(context.parentURL))
      : process.cwd();
    const hit = tryFile(path.resolve(parent, specifier));
    if (hit) {
      return nextResolve(pathToFileURL(hit).href, context);
    }
  }
  return nextResolve(specifier, context);
}
