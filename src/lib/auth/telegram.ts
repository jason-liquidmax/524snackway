import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Login Widget callback fields (https://core.telegram.org/widgets/login).
export type TelegramLoginPayload = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

// Freshness window from Telegram's docs.
const MAX_AUTH_AGE_SECONDS = 2 * 60 * 60;

export function verifyTelegramLogin(
  payload: TelegramLoginPayload,
  botToken: string,
  now: Date = new Date(),
): { ok: true } | { ok: false; reason: "stale" | "bad_hash" | "malformed" } {
  if (!payload || typeof payload.hash !== "string" || typeof payload.id !== "number" || typeof payload.auth_date !== "number") {
    return { ok: false, reason: "malformed" };
  }

  const ageSeconds = Math.floor(now.getTime() / 1000) - payload.auth_date;
  if (ageSeconds < 0 || ageSeconds > MAX_AUTH_AGE_SECONDS) {
    return { ok: false, reason: "stale" };
  }

  const { hash, ...rest } = payload;
  const dataCheckString = (Object.keys(rest) as (keyof typeof rest)[])
    .filter((k) => rest[k] !== undefined && rest[k] !== null)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("\n");

  const secretKey = createHash("sha256").update(botToken).digest();
  const computed = createHmac("sha256", secretKey).update(dataCheckString).digest();

  let received: Buffer;
  try {
    received = Buffer.from(hash, "hex");
  } catch {
    return { ok: false, reason: "bad_hash" };
  }
  if (received.length !== computed.length) return { ok: false, reason: "bad_hash" };
  if (!timingSafeEqual(received, computed)) return { ok: false, reason: "bad_hash" };

  return { ok: true };
}

// Server-secret HMAC: turns sensitive material (raw nonces, Telegram hashes)
// into deterministic-but-non-reversible fingerprints suitable for at-rest storage.
export function fingerprint(input: string | Buffer, serverSecret: string): Buffer {
  return createHmac("sha256", serverSecret).update(input).digest();
}
