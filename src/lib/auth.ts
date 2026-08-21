const COOKIE = "oshi_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 14;

export type Role = "member" | "admin";

export type Session = {
  userId: string;
  role: Role;
  exp: number;
};

function bytesToB64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function b64UrlToBytes(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = s.replaceAll("-", "+").replaceAll("_", "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(secret: string, payload: string): Promise<string> {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return bytesToB64Url(new Uint8Array(sig));
}

export async function encodeSession(
  session: Session,
  secret: string,
): Promise<string> {
  const payload = bytesToB64Url(
    new TextEncoder().encode(JSON.stringify(session)),
  );
  const sig = await sign(secret, payload);
  return `${payload}.${sig}`;
}

export async function decodeSession(
  token: string | null,
  secret: string,
): Promise<Session | null> {
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = await sign(secret, payload);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  if (diff !== 0) return null;
  try {
    const json = new TextDecoder().decode(b64UrlToBytes(payload));
    const session = JSON.parse(json) as Session;
    if (session.exp < Date.now()) return null;
    if (session.role !== "member" && session.role !== "admin") return null;
    if (!session.userId) return null;
    return session;
  } catch {
    return null;
  }
}

export function readCookie(request: Request, name = COOKIE): string | null {
  const header = request.headers.get("Cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function sessionFromRequest(
  request: Request,
  secret: string,
): Promise<Session | null> {
  return decodeSession(readCookie(request), secret);
}

export function sessionCookie(token: string): string {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aa = enc.encode(a);
  const bb = enc.encode(b);
  const n = Math.max(aa.length, bb.length);
  let diff = aa.length ^ bb.length;
  for (let i = 0; i < n; i++) {
    diff |= (aa[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

export function newId(): string {
  return crypto.randomUUID();
}

export function sessionExpiry(): number {
  return Date.now() + MAX_AGE_SEC * 1000;
}
