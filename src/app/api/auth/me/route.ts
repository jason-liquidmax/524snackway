import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MeRow = {
  id: number;
  display_name: string | null;
  linked_telegram_accounts: { username: string | null; photo_url: string | null } | null;
};

export async function GET() {
  const appSecret = process.env.APP_SECRET;
  if (!appSecret) return NextResponse.json({ user: null }, { status: 500 });

  const jar = await cookies();
  const session = verifySession(jar.get(SESSION_COOKIE)?.value, appSecret);
  if (!session) return NextResponse.json({ user: null });

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("users")
    .select("id, display_name, linked_telegram_accounts(username, photo_url)")
    .eq("id", session.uid)
    .maybeSingle<MeRow>();
  if (error || !data) return NextResponse.json({ user: null });

  return NextResponse.json({
    user: {
      id: data.id,
      displayName: data.display_name,
      telegramUsername: data.linked_telegram_accounts?.username ?? null,
      photoUrl: data.linked_telegram_accounts?.photo_url ?? null,
    },
  });
}
