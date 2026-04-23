import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fingerprint } from "@/lib/auth/telegram";
import { generateNonce, INTENT_COOKIE, intentCookieMaxAge } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const serverSecret = process.env.SERVER_SECRET;
  if (!serverSecret) return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });

  const { raw, bytes } = generateNonce();
  const fp = fingerprint(bytes, serverSecret);
  const expiresAt = new Date(Date.now() + intentCookieMaxAge() * 1000);

  const sb = supabaseAdmin();
  const { error } = await sb.from("telegram_auth_intents").insert({
    nonce_fingerprint: `\\x${fp.toString("hex")}`,
    expires_at: expiresAt.toISOString(),
  });
  if (error) return NextResponse.json({ error: "intent_insert_failed" }, { status: 500 });

  const jar = await cookies();
  jar.set(INTENT_COOKIE, raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: intentCookieMaxAge(),
  });

  return NextResponse.json({ ok: true });
}
