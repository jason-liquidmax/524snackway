import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fingerprint, verifyTelegramLogin, type TelegramLoginPayload } from "@/lib/auth/telegram";
import { INTENT_COOKIE, SESSION_COOKIE, sessionCookieMaxAge, signSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LinkedAccountRow = {
  user_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  users: { id: number; display_name: string | null } | null;
};

async function logEvent(
  sb: ReturnType<typeof supabaseAdmin>,
  args: {
    userId: number | null;
    telegramId: number;
    authDate: Date;
    hashFingerprint: Buffer;
    ip: string | null;
    userAgent: string | null;
    outcome: "linked" | "relogin" | "rejected_replay" | "rejected_csrf" | "rejected_stale";
  },
) {
  await sb.from("telegram_auth_events").insert({
    user_id: args.userId,
    telegram_id: args.telegramId,
    auth_date: args.authDate.toISOString(),
    hash_fingerprint: `\\x${args.hashFingerprint.toString("hex")}`,
    ip_inet: args.ip,
    user_agent: args.userAgent,
    outcome: args.outcome,
  });
}

export async function POST(req: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const appSecret = process.env.APP_SECRET;
  if (!botToken || !appSecret) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  let payload: TelegramLoginPayload;
  try {
    payload = (await req.json()) as TelegramLoginPayload;
  } catch {
    return NextResponse.json({ error: "bad_payload" }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = req.headers.get("user-agent");
  const hashFp = fingerprint(payload.hash ?? "", appSecret);
  const authDate = new Date((payload.auth_date ?? 0) * 1000);

  // 1. CSRF: redeem the intent cookie before doing any expensive work.
  const jar = await cookies();
  const intentRaw = jar.get(INTENT_COOKIE)?.value;
  if (!intentRaw) {
    await logEvent(sb, { userId: null, telegramId: payload.id ?? 0, authDate, hashFingerprint: hashFp, ip, userAgent, outcome: "rejected_csrf" });
    return NextResponse.json({ error: "missing_intent" }, { status: 400 });
  }
  const intentFp = fingerprint(Buffer.from(intentRaw, "base64url"), appSecret);
  const fpHex = `\\x${intentFp.toString("hex")}`;

  const { data: intentRow, error: intentErr } = await sb
    .from("telegram_auth_intents")
    .select("nonce_fingerprint, expires_at, consumed_at")
    .eq("nonce_fingerprint", fpHex)
    .maybeSingle();
  if (intentErr || !intentRow) {
    await logEvent(sb, { userId: null, telegramId: payload.id ?? 0, authDate, hashFingerprint: hashFp, ip, userAgent, outcome: "rejected_csrf" });
    return NextResponse.json({ error: "invalid_intent" }, { status: 400 });
  }
  if (intentRow.consumed_at || new Date(intentRow.expires_at).getTime() < Date.now()) {
    await logEvent(sb, { userId: null, telegramId: payload.id ?? 0, authDate, hashFingerprint: hashFp, ip, userAgent, outcome: "rejected_csrf" });
    return NextResponse.json({ error: "expired_intent" }, { status: 400 });
  }

  // Atomically mark consumed (treat double-consume as CSRF).
  const { data: consumed } = await sb
    .from("telegram_auth_intents")
    .update({ consumed_at: new Date().toISOString() })
    .eq("nonce_fingerprint", fpHex)
    .is("consumed_at", null)
    .select("nonce_fingerprint")
    .maybeSingle();
  if (!consumed) {
    await logEvent(sb, { userId: null, telegramId: payload.id ?? 0, authDate, hashFingerprint: hashFp, ip, userAgent, outcome: "rejected_csrf" });
    return NextResponse.json({ error: "intent_race" }, { status: 400 });
  }
  jar.delete(INTENT_COOKIE);

  // 2. Verify Telegram HMAC.
  const verdict = verifyTelegramLogin(payload, botToken);
  if (!verdict.ok) {
    const outcome = verdict.reason === "stale" ? "rejected_stale" : "rejected_csrf";
    await logEvent(sb, { userId: null, telegramId: payload.id ?? 0, authDate, hashFingerprint: hashFp, ip, userAgent, outcome });
    return NextResponse.json({ error: verdict.reason }, { status: 400 });
  }

  // 3. Replay detection: UNIQUE (telegram_id, hash_fingerprint) on the events table
  //    catches the same Login Widget payload being submitted twice.
  const { data: prior } = await sb
    .from("telegram_auth_events")
    .select("id")
    .eq("telegram_id", payload.id)
    .eq("hash_fingerprint", `\\x${hashFp.toString("hex")}`)
    .maybeSingle();
  if (prior) {
    await logEvent(sb, { userId: null, telegramId: payload.id, authDate, hashFingerprint: hashFp, ip, userAgent, outcome: "rejected_replay" });
    return NextResponse.json({ error: "replay" }, { status: 400 });
  }

  // 4. Look up or create the user via the linked-accounts table.
  const { data: linked } = await sb
    .from("linked_telegram_accounts")
    .select("user_id, username, first_name, last_name, photo_url, users!inner(id, display_name)")
    .eq("telegram_id", payload.id)
    .maybeSingle<LinkedAccountRow>();

  let userId: number;
  let displayName: string | null;
  let outcome: "linked" | "relogin";

  if (linked) {
    userId = linked.user_id;
    displayName = linked.users?.display_name ?? null;
    outcome = "relogin";
    await sb
      .from("linked_telegram_accounts")
      .update({
        username: payload.username ?? null,
        first_name: payload.first_name ?? null,
        last_name: payload.last_name ?? null,
        photo_url: payload.photo_url ?? null,
        last_verified_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    await sb.from("users").update({ last_seen_at: new Date().toISOString() }).eq("id", userId);
  } else {
    const composed = [payload.first_name, payload.last_name].filter(Boolean).join(" ");
    const fallbackName = payload.username ?? (composed.length > 0 ? composed : null);
    const { data: createdUser, error: userErr } = await sb
      .from("users")
      .insert({ display_name: fallbackName })
      .select("id, display_name")
      .single();
    if (userErr || !createdUser) {
      return NextResponse.json({ error: "user_create_failed" }, { status: 500 });
    }
    userId = createdUser.id as number;
    displayName = (createdUser.display_name as string | null) ?? null;
    const { error: linkErr } = await sb.from("linked_telegram_accounts").insert({
      user_id: userId,
      telegram_id: payload.id,
      username: payload.username ?? null,
      first_name: payload.first_name ?? null,
      last_name: payload.last_name ?? null,
      photo_url: payload.photo_url ?? null,
    });
    if (linkErr) return NextResponse.json({ error: "link_failed" }, { status: 500 });
    outcome = "linked";
  }

  await logEvent(sb, { userId, telegramId: payload.id, authDate, hashFingerprint: hashFp, ip, userAgent, outcome });

  // 5. Mint the session cookie.
  const token = signSession(userId, appSecret);
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionCookieMaxAge(),
  });

  return NextResponse.json({
    user: {
      id: userId,
      displayName,
      telegramUsername: payload.username ?? null,
      photoUrl: payload.photo_url ?? null,
    },
  });
}
