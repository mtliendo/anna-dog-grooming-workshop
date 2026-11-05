# Anna's Dog Grooming — Phase 1

**AI Security for the everyday dev** · a 1-hour hands-on workshop by [Michael Liendo](https://focusotter.com) ([@focusotter](https://x.com/focusotter)), Staff Developer Advocate at Auth0.

You're hired! Anna just opened a boutique grooming salon and needs software before the first doodle walks in. In this phase you will:

1. Sign customers in with **Auth0** (email + password *or* the default Google social connection).
2. Let each customer register their dogs and book a grooming appointment.
3. Store everything in a **local SQLite file** — scoped to `session.user.sub` so one customer never sees another customer's roster.

No extra databases. No Auth0 CLI. No native C++ addons. Attendees only need **Node.js 20+** and **Git**.

```bash
git clone https://github.com/mtliendo/anna-dog-grooming-workshop.git
cd anna-dog-grooming-workshop
npm install
cp .env.example .env.local
# fill in the Auth0 values (see below), then:
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Until `.env.local` is real, the app renders a **Workshop Setup Needed** card instead of crashing.

---

## Architecture

```mermaid
flowchart LR
  Browser["Customer browser"] -->|"/auth/login"| Auth0["Auth0 Universal Login"]
  Auth0 -->|"/auth/callback"| Next["Next.js App Router"]
  Next -->|"session.user.sub"| SQLite["libsql SQLite\nfile:./data/anna-grooming.db"]
  Next -->|"dogs + appointments"| Browser
```

| Piece | Why it's here |
| --- | --- |
| `@auth0/nextjs-auth0` v4 | Cookie session, `/auth/login`, `/auth/logout`, `/auth/callback` |
| `@libsql/client` | Pure JS/WASM SQLite — **not** `better-sqlite3`, so macOS/Windows/Linux work without Xcode CLT or Python |
| `user_sub` on every row | The isolation story: identity from Auth0 is the row key |

---

## Prerequisites

- **Node.js 20+** and **npm** (this repo ships `package-lock.json` — please don't switch to pnpm/yarn mid-workshop)
- **Git**
- A free [Auth0](https://auth0.com/signup) account

That's it. No Postgres, no Redis, no Auth0 CLI, no Google Cloud project yet.

---

## Auth0 Dashboard setup

All tenant work happens in the dashboard. Do **not** run the Auth0 CLI or call the Management API.

### 1. Create a Regular Web Application

1. Open [Auth0 Dashboard](https://manage.auth0.com/) → **Applications → Applications → Create Application**.
2. Name it `Anna's Dog Grooming`.
3. Choose **Regular Web Applications** (not SPA, not Native). Next.js keeps a client secret on the server.
4. Create.

### 2. Point it at localhost

On the **Settings** tab, paste:

| Setting | Value |
| --- | --- |
| Allowed Callback URLs | `http://localhost:3000/auth/callback` |
| Allowed Logout URLs | `http://localhost:3000` |
| Allowed Web Origins | `http://localhost:3000` |

Scroll to the bottom and **Save Changes**.

### 3. Fill in `.env.local`

```bash
cp .env.example .env.local
```

```
AUTH0_SECRET=          # openssl rand -hex 32
APP_BASE_URL=http://localhost:3000
AUTH0_DOMAIN=          # e.g. dev-abc123.us.auth0.com  (no https://)
AUTH0_CLIENT_ID=       # from the application Settings tab
AUTH0_CLIENT_SECRET=   # from the same tab
```

`AUTH0_DOMAIN` is the hostname only. `APP_BASE_URL` is how the SDK builds `/auth/callback`.

Restart `npm run dev` after saving.

### 4. Try both login methods

Auth0 tenants ship with **Username-Password-Authentication** and a **Google** social connection already on.

- **Email + password** — click **Sign up**, create a customer.  
  **Pro tip:** new Auth0 tenants require a **15+ character** password by default. `AnnaLovesDoodles!` works.
- **Google** — the default Google connection uses Auth0's built-in *developer* keys. That's perfect for "can I sign in?" in Phase 1.

> **Why we'll bring our own Google OAuth keys in Phase 2:** Auth0's shared Google dev keys are fine for login. They do **not** issue refresh tokens, and they cannot be used with **Token Vault / Connected Accounts**. Phase 2 swaps in a Google Cloud OAuth client so Anna can drop a reminder on the customer's real calendar *without this app ever storing a Google refresh token*.

---

## Code tour

### `lib/auth0.ts`

v4's `Auth0Client` reads `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`, and `APP_BASE_URL`. We construct it **lazily** so a missing `.env.local` never throws during `next build` or first paint.

### `proxy.ts` (Next.js 16; this used to be `middleware.ts`)

```ts
export async function proxy(request: NextRequest) {
  if (!isAuth0Configured()) return NextResponse.next();
  return getAuth0().middleware(request);
}
```

That one call mounts:

- `/auth/login`
- `/auth/logout`
- `/auth/callback`
- `/auth/profile`

There is no `/api/auth/*` prefix in v4.

### `lib/db.ts`

`@libsql/client` opens `file:./data/anna-grooming.db` and creates `./data/` plus the `dogs` / `appointments` tables on first use. Every query includes `WHERE user_sub = ?`. The sample dog button inserts **Barnaby · Golden Doodle** so the projector demo is one click.

The service catalog (`Bath & Brush`, `Full Groom`, `Puppy Intro Trim`, `Nail & Paw Spa`) is seeded in `lib/services.ts` — not in SQLite — so attendees can change prices without a migration.

---

## After the workshop / keep building

Phase 1 is the salon: identity + your own data. Next, Anna wants appointment reminders on Google Calendar — without a `google_refresh_token` column in SQLite.

```bash
git checkout phase-2-calendar
npm install   # only if lockfile changed
npm run dev
```

Phase 2 adds Auth0 **Token Vault** / **Connected Accounts**. Phase 3 (`git checkout phase-3-mcp`) turns the same SQLite book into a **secure MCP server** so Grok, Cursor, or Claude can book as the signed-in customer.

---

## Scripts

```bash
npm run dev     # http://localhost:3000
npm run build   # production build — must pass without .env.local
npm run lint    # eslint
```
