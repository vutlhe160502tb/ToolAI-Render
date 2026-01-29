import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const ADMIN_COOKIE_NAME = "surreal_admin_session";

const textEncoder = new TextEncoder();

function base64UrlEncode(input: string | Uint8Array) {
  const bytes = typeof input === "string" ? textEncoder.encode(input) : input;
  const b64 = Buffer.from(bytes).toString("base64");
  return b64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecodeToString(input: string) {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return Buffer.from(b64 + pad, "base64").toString("utf8");
}

function base64UrlDecodeToBuffer(input: string) {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return Buffer.from(b64 + pad, "base64");
}

function getAdminCredentials() {
  return {
    username: process.env.SURREAL_ADMIN_USER ?? "surrealAdmin",
    password: process.env.SURREAL_ADMIN_PASSWORD ?? "Lynx@12345",
  };
}

function getCookieSecret() {
  return (
    process.env.SURREAL_ADMIN_COOKIE_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "dev-surreal-admin-secret"
  );
}

function hmac(payloadB64: string) {
  return createHmac("sha256", getCookieSecret()).update(payloadB64).digest();
}

export function verifyAdminCredentials(username: string, password: string) {
  const c = getAdminCredentials();
  return username === c.username && password === c.password;
}

export function createAdminSessionCookieValue(username: string) {
  const payload = JSON.stringify({ u: username, iat: Date.now() });
  const payloadB64 = base64UrlEncode(payload);
  const sigB64 = base64UrlEncode(hmac(payloadB64));
  return `${payloadB64}.${sigB64}`;
}

export function isAdminSessionCookieValid(value: string | undefined) {
  if (!value) return false;
  const [payloadB64, sigB64] = value.split(".");
  if (!payloadB64 || !sigB64) return false;

  const expected = hmac(payloadB64);
  const actual = base64UrlDecodeToBuffer(sigB64);
  if (actual.length !== expected.length) return false;
  if (!timingSafeEqual(actual, expected)) return false;

  try {
    const payload = JSON.parse(base64UrlDecodeToString(payloadB64)) as {
      u?: string;
      iat?: number;
    };
    return payload.u === getAdminCredentials().username;
  } catch {
    return false;
  }
}

export function getAdminCookieFromRequest(req: NextRequest) {
  return req.cookies.get(ADMIN_COOKIE_NAME)?.value;
}

export function requireAdminApi(req: NextRequest) {
  const cookieValue = getAdminCookieFromRequest(req);
  if (!isAdminSessionCookieValid(cookieValue)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return null;
}

