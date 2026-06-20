import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Sessions are HMAC-signed cookies (no DB roundtrip). Payload is small JSON;
// signing prevents tampering. Keep the cookie HttpOnly + Secure + SameSite=Lax.
export type SessionPayload = {
  uid: number;       // users.id
  iat: number;       // issued-at (unix seconds)
  exp: number;       // expiry (unix seconds)
};

export const SESSION_COOKIE = "snackway_session";
export const INTENT_COOKIE = "snackway_auth_intent";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;          // 30 days
const INTENT_TTL_SECONDS = 5 * 60;                       // 5 minutes

export function sessionCookieMaxAge(): number {
  return SESSION_TTL_SECONDS;
}

export function intentCookieMaxAge(): number {
  return INTENT_TTL_SECONDS;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function fromB64url(s: string): Buffer {
  return Buffer.from(s, "base64url");
}

export function signSession(uid: number, secret: string, now: Date = new Date()): string {
  const iat = Math.floor(now.getTime() / 1000);
  const payload: SessionPayload = { uid, iat, exp: iat + SESSION_TTL_SECONDS };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = b64url(createHmac("sha256", secret).update(body).digest());
  return `${body}.${sig}`;
}

export function verifySession(
  token: string | undefined,
  secret: string,
  now: Date = new Date(),
): SessionPayload | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = createHmac("sha256", secret).update(body).digest();
  let received: Buffer;
  try {
    received = fromB64url(sig);
  } catch {
    return null;
  }
  if (received.length !== expected.length) return null;
  if (!timingSafeEqual(received, expected)) return null;

  let parsed: SessionPayload;
  try {
    parsed = JSON.parse(fromB64url(body).toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
  if (typeof parsed.uid !== "number" || typeof parsed.exp !== "number") return null;
  if (parsed.exp < Math.floor(now.getTime() / 1000)) return null;
  return parsed;
}

// 256-bit nonce for the auth-intent flow. Returned as base64url for cookie use.
export function generateNonce(): { raw: string; bytes: Buffer } {
  const bytes = randomBytes(32);
  return { raw: b64url(bytes), bytes };
}
