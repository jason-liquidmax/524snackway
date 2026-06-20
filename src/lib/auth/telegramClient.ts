"use client";

import type { TelegramLoginPayload } from "./telegram";
import { useAuth, type AuthUser } from "./store";

declare global {
  interface Window {
    __snackwayTgCallback?: (payload: TelegramLoginPayload) => void;
  }
}

const SCRIPT_SRC = "https://telegram.org/js/telegram-widget.js?22";
const CALLBACK_NAME = "__snackwayTgCallback";
const HOST_ID = "snackway-tg-host";

// The Login Widget only renders inside an <iframe> spawned by their script,
// so we mount it into a hidden host, then click the iframe button for the user.
// The iframe popup itself satisfies Telegram's "user gesture" requirement
// because the click that calls signInWithTelegram() is the gesture.
export async function signInWithTelegram(): Promise<AuthUser | null> {
  const username = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  if (!username) throw new Error("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is not set");

  const intent = await fetch("/api/auth/intent", { method: "POST", credentials: "include" });
  if (!intent.ok) return null;

  const payload = await new Promise<TelegramLoginPayload | null>((resolve) => {
    let host = document.getElementById(HOST_ID) as HTMLDivElement | null;
    if (!host) {
      host = document.createElement("div");
      host.id = HOST_ID;
      host.style.position = "fixed";
      host.style.left = "-9999px";
      host.style.top = "0";
      host.style.opacity = "0";
      host.style.pointerEvents = "none";
      document.body.appendChild(host);
    }
    while (host.firstChild) host.removeChild(host.firstChild);

    window[CALLBACK_NAME] = (data: TelegramLoginPayload) => resolve(data);

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.setAttribute("data-telegram-login", username);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", `${CALLBACK_NAME}(user)`);
    script.setAttribute("data-request-access", "write");
    script.onerror = () => resolve(null);
    host.appendChild(script);

    const start = Date.now();
    const click = () => {
      const btn = host?.querySelector<HTMLElement>("iframe");
      if (btn) {
        btn.click();
        return;
      }
      if (Date.now() - start > 5000) {
        resolve(null);
        return;
      }
      requestAnimationFrame(click);
    };
    click();
  });

  delete window[CALLBACK_NAME];
  if (!payload) return null;

  const cb = await fetch("/api/auth/callback", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!cb.ok) return null;
  const data = (await cb.json()) as { user: AuthUser };
  useAuth.getState().setUser(data.user);
  return data.user;
}
