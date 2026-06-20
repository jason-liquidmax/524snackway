-- Snackway database schema (Postgres).
-- Drop-in replacement for the localStorage prototype in src/app/page.tsx.
-- Identity is Telegram-based (wallet address optional/secondary).
-- Votes/favorites are toggleable and unique per (item, user); comments are
-- append-only with soft delete.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE item_type      AS ENUM ('snack', 'drink');
CREATE TYPE vote_direction AS ENUM ('up', 'down');

-- ---------------------------------------------------------------------------
-- Users — primary application identity. Telegram (and any future provider) is
-- a *linked* account, not the identity itself.
-- ---------------------------------------------------------------------------

CREATE TABLE users (
  id             BIGSERIAL   PRIMARY KEY,
  wallet_address TEXT        UNIQUE
                 CHECK (wallet_address IS NULL OR wallet_address ~ '^0x[0-9a-f]{40}$'),
  display_name   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Linked Telegram accounts — OAuth-style link from an existing user to a
-- Telegram identity via the Telegram Login Widget. One Telegram account
-- links to at most one user, and one user has at most one Telegram link.
--
-- Field shapes follow the Login Widget callback
-- (https://core.telegram.org/widgets/login).
-- ---------------------------------------------------------------------------

CREATE TABLE linked_telegram_accounts (
  user_id          BIGINT      PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  telegram_id      BIGINT      UNIQUE NOT NULL,
  username         TEXT,
  first_name       TEXT,
  last_name        TEXT,
  photo_url        TEXT,
  linked_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX linked_telegram_accounts_username_idx ON linked_telegram_accounts (username);

-- ---------------------------------------------------------------------------
-- Telegram auth intents — server-issued, single-use, short-lived nonces.
-- Telegram is the *only* auth provider, so the nonce binds the auth attempt
-- to a specific browser via an HttpOnly cookie (no pre-existing user yet on
-- first sign-in). Defends against session-fixation: an attacker can't trick a
-- victim into completing a Telegram auth bound to the attacker's browser.
--
-- Flow:
--   1. User clicks "Sign in with Telegram" -> server generates 256-bit nonce,
--      stores HMAC(nonce) here with 5-min expiry, sets HttpOnly cookie with
--      the raw nonce. Cookie is the proof-of-possession.
--   2. Telegram popup returns payload to client; client POSTs payload to
--      /api/auth/callback (cookie sent automatically).
--   3. Server: HMAC(cookie nonce) -> lookup row, check not expired/consumed,
--      mark consumed_at, then verify the Telegram HMAC against bot_token.
-- Stored fingerprint (not raw nonce) so a DB read never yields a usable token.
-- ---------------------------------------------------------------------------

CREATE TABLE telegram_auth_intents (
  nonce_fingerprint BYTEA       PRIMARY KEY,    -- HMAC_SHA256(nonce, server_secret)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL,
  consumed_at       TIMESTAMPTZ,
  CHECK (expires_at > created_at)
);

CREATE INDEX telegram_auth_intents_expiry_idx ON telegram_auth_intents (expires_at);

-- ---------------------------------------------------------------------------
-- Telegram auth events — one row per successful Login Widget hash
-- verification (link or re-login). HMAC derivation:
--   secret_key = SHA256(bot_token)
--   hash       = HMAC_SHA256(data_check_string, secret_key)
--
-- We store only HMAC(hash, server_secret) — never the verified Telegram hash
-- itself, which is sensitive material that could be probed offline against
-- known bot-token candidates. The fingerprint is enough for replay detection
-- via UNIQUE (telegram_id, hash_fingerprint).
--
-- Login Widget freshness window is 2h; enforce in app code, not schema.
-- Retention: delete rows older than 90 days unless flagged for forensics.
-- ---------------------------------------------------------------------------

CREATE TABLE telegram_auth_events (
  id               BIGSERIAL   PRIMARY KEY,
  user_id          BIGINT      REFERENCES users(id) ON DELETE SET NULL,
  telegram_id      BIGINT      NOT NULL,
  auth_date        TIMESTAMPTZ NOT NULL,
  hash_fingerprint BYTEA       NOT NULL,
  ip_inet          INET,
  user_agent       TEXT,
  outcome          TEXT        NOT NULL CHECK (outcome IN ('linked','relogin','rejected_replay','rejected_csrf','rejected_stale')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (telegram_id, hash_fingerprint)
);

CREATE INDEX telegram_auth_events_user_idx ON telegram_auth_events (user_id, created_at DESC);
CREATE INDEX telegram_auth_events_tg_idx   ON telegram_auth_events (telegram_id, created_at DESC);
CREATE INDEX telegram_auth_events_ip_idx   ON telegram_auth_events (ip_inet, created_at DESC);

-- ---------------------------------------------------------------------------
-- Locations — multi-tenant ready; ships with one row for 524 Snackway.
-- ---------------------------------------------------------------------------

CREATE TABLE locations (
  id         BIGSERIAL   PRIMARY KEY,
  slug       TEXT        UNIQUE NOT NULL,
  name       TEXT        NOT NULL,
  address    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO locations (slug, name, address)
VALUES ('524-snackway', '524 Snackway', 'New York, NY 10012');

-- ---------------------------------------------------------------------------
-- Items — replaces the hardcoded `items` array.
-- ---------------------------------------------------------------------------

CREATE TABLE items (
  id          BIGSERIAL   PRIMARY KEY,
  location_id BIGINT      NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  type        item_type   NOT NULL,
  description TEXT,
  image_url   TEXT,
  glb_url     TEXT,
  position    INTEGER     NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX items_location_active_idx
  ON items (location_id, position)
  WHERE archived_at IS NULL;

-- ---------------------------------------------------------------------------
-- Votes — one row per (item, user). Toggle off = DELETE.
-- Switching direction = UPDATE direction + bump updated_at (drives feed sort).
-- ---------------------------------------------------------------------------

CREATE TABLE votes (
  item_id    BIGINT         NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id    BIGINT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  direction  vote_direction NOT NULL,
  created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  PRIMARY KEY (item_id, user_id)
);

CREATE INDEX votes_item_idx        ON votes (item_id);
CREATE INDEX votes_user_idx        ON votes (user_id);
CREATE INDEX votes_recent_idx      ON votes (updated_at DESC);
CREATE INDEX votes_item_recent_idx ON votes (item_id, updated_at DESC);

-- ---------------------------------------------------------------------------
-- Favorites (the star icon in the UI). Distinct from up/down votes; toggleable.
-- ---------------------------------------------------------------------------

CREATE TABLE favorites (
  item_id    BIGINT      NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (item_id, user_id)
);

CREATE INDEX favorites_item_idx ON favorites (item_id);
CREATE INDEX favorites_user_idx ON favorites (user_id);

-- ---------------------------------------------------------------------------
-- Comments — append-only with edit/soft-delete fields for future use.
-- ---------------------------------------------------------------------------

CREATE TABLE comments (
  id         BIGSERIAL   PRIMARY KEY,
  item_id    BIGINT      NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT        NOT NULL CHECK (length(trim(body)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at  TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX comments_item_active_idx
  ON comments (item_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX comments_user_idx ON comments (user_id);

-- ---------------------------------------------------------------------------
-- Aggregate view — single source for the SELECT panel + grid cell tallies.
-- ---------------------------------------------------------------------------

CREATE VIEW item_stats AS
SELECT
  i.id AS item_id,
  COALESCE(v.upvotes,      0) AS upvotes,
  COALESCE(v.downvotes,    0) AS downvotes,
  COALESCE(f.favorites,    0) AS favorites,
  COALESCE(c.comment_count, 0) AS comment_count
FROM items i
LEFT JOIN (
  SELECT item_id,
    COUNT(*) FILTER (WHERE direction = 'up')   AS upvotes,
    COUNT(*) FILTER (WHERE direction = 'down') AS downvotes
  FROM votes
  GROUP BY item_id
) v ON v.item_id = i.id
LEFT JOIN (
  SELECT item_id, COUNT(*) AS favorites
  FROM favorites
  GROUP BY item_id
) f ON f.item_id = i.id
LEFT JOIN (
  SELECT item_id, COUNT(*) AS comment_count
  FROM comments
  WHERE deleted_at IS NULL
  GROUP BY item_id
) c ON c.item_id = i.id;

-- ---------------------------------------------------------------------------
-- Activity feed view — drives the global/per-snack panel in VOTE mode.
-- Unioned across votes, comments, favorites; sorted by recency.
-- ---------------------------------------------------------------------------

CREATE VIEW activity_feed AS
SELECT 'vote'::TEXT     AS kind, v.user_id, v.item_id, v.direction::TEXT AS detail, v.updated_at AS at
  FROM votes v
UNION ALL
SELECT 'comment'::TEXT  AS kind, c.user_id, c.item_id, NULL              AS detail, c.created_at AS at
  FROM comments c
  WHERE c.deleted_at IS NULL
UNION ALL
SELECT 'favorite'::TEXT AS kind, f.user_id, f.item_id, NULL              AS detail, f.created_at AS at
  FROM favorites f;

-- ---------------------------------------------------------------------------
-- updated_at trigger for items + votes
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_touch_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER votes_touch_updated_at
  BEFORE UPDATE ON votes
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
