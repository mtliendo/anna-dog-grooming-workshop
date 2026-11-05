![AI Security for the Everyday Dev — Anna's Dog Grooming Workshop](docs/screenshots/header-banner.png)

# Anna's Dog Grooming — Phase 2

**Token Vault + Google Calendar reminders** · built on Phase 1.

Anna wants every grooming appointment to land on the customer's own Google Calendar. The tempting shortcut is a `google_refresh_token` column in SQLite. **Don't.** Auth0 **Token Vault** holds the Google tokens; this app only ever sees a short-lived access token from `auth0.getAccessTokenForConnection({ connection: "google-oauth2" })`.

```bash
git checkout phase-2-calendar
npm install
npm run dev
```

Your Phase 1 SQLite file carries over. `lib/db.ts` runs an idempotent `ALTER TABLE ... ADD COLUMN` for `calendar_event_id` and `calendar_event_link` if they are missing.

Screenshots below are from a real workshop tenant. In prose we write **`<YOUR_AUTH0_DOMAIN>`** (for example `your-tenant.us.auth0.com`). The images still show the demo tenant we used while recording — your slug will be different.

If the in-app **Workshop Setup Needed** card is still up, paste callback / logout / CORS values on the application's **URLs** tab (not Settings), press **Enter** so each becomes a **DEV** chip, then **Save**.

---

## What you're building

Before Token Vault is linked, the salon shows a **Connect Google Calendar** card and an **Add Reminder to Calendar** action on each visit:

![Phase 2 — Google Calendar not connected](docs/screenshots/app-03-phase2-calendar-unconnected.png)

After the customer connects, Auth0 Token Vault holds the Google tokens. Appointments grow a **View in Google Calendar** badge from `calendar_event_link` — still no refresh token in SQLite:

![Phase 2 — Token Vault connected with calendar reminder badges](docs/screenshots/app-04-phase2-calendar-connected.png)

---

## Why Phase 1's Google login is not enough

The default Google social connection on a new Auth0 tenant uses **Auth0's shared developer keys**. Those keys are perfect for "can I click Sign in with Google?" in Phase 1.

They do **not**:

- Issue Google **refresh tokens**
- Allow **Token Vault / Connected Accounts**
- Let this app call `GET/POST https://www.googleapis.com/calendar/v3/...`

That starting point looks like this — Token Vault radios exist, **Offline Access** and **Calendar** are still unchecked, and the yellow development-keys banner is still up:

![google-oauth2 before your own keys — Token Vault radios and Calendar scopes](docs/screenshots/09-google-social-scopes-and-token-vault.png)

Phase 2 swaps in **your own Google Cloud OAuth Client ID + Secret**, then turns on Token Vault so `/auth/connect` can store Google tokens in Auth0 — never in `data/anna-grooming.db`.

---

## Architecture

```mermaid
flowchart LR
  UI["Connect Google Calendar"] -->|"/auth/connect?connection=google-oauth2"| SDK["nextjs-auth0 v4\nenableConnectAccountEndpoint"]
  SDK --> MyAccount["Auth0 My Account API\n/me/v1/connected-accounts"]
  MyAccount --> Google["Google OAuth consent"]
  Google --> Vault["Auth0 Token Vault"]
  Book["Book / Add Reminder"] -->|"getAccessTokenForConnection"| Vault
  Book -->|"POST /calendar/v3/calendars/primary/events"| Cal["Google Calendar"]
  Cal -->|"htmlLink"| SQLite["appointments.calendar_event_link"]
```

---

## Google Cloud Console (self-paced)

Do this in [Google Cloud Console](https://console.cloud.google.com/) before touching Auth0 again.

### 1. Create a project

**New Project** — name it something like `Anna Dog Grooming Workshop`, then **Create**.

![Google Cloud — create the workshop project](docs/screenshots/12-gcp-create-project.png)

### 2. Enable the Google Calendar API

**APIs & Services → Library** → search **Google Calendar API** → **Enable**. You should land on a page whose status is **Enabled**.

![Google Calendar API enabled](docs/screenshots/13-gcp-enable-calendar-api.png)

### 3. Branding & Audience (Google Auth Platform)

Open **Google Auth Platform → Branding** and fill in the app name / support email.

Then open **Audience**:

- **User type:** **External**
- **Publishing status:** **Testing**

> **Important Pro Tip — Test users:** under **Test users** you **must** add an email associated with a **real Google / Gmail or Google Workspace account**. Google rejects `+alias` addresses and non-Google-account emails. If Connect fails with a vague "access denied" after consent, this is usually why.

![Google Auth Platform Audience — External, Testing, Test users](docs/screenshots/14-gcp-oauth-audience-testing.png)

### 4. Create the OAuth client

**Google Auth Platform → Clients → Create Client**

- Application type: **Web application**
- Name: `Anna's Dog Grooming Auth0` (or similar)
- **Authorized redirect URI** — this is Auth0's callback, **not** localhost:

  ```
  https://<YOUR_AUTH0_DOMAIN>/login/callback
  ```

Copy the **Client ID** and **Client Secret**.

![OAuth web client with Auth0 /login/callback as the redirect URI](docs/screenshots/15-gcp-oauth-client-redirect-uri.png)

---

## Auth0 Dashboard — 4 checkpoints (November 2026 UI)

Do this by hand. No CLI, no Management API.

### Checkpoint 1 — `Authentication → Social → google-oauth2`

1. Paste your Google **Client ID** and **Client Secret**.
2. Select the **second** radio card: **"Authentication and Connected Accounts for Token Vault"** — so Google still works for Phase 1 sign-in *and* for `/auth/connect`.
3. If Auth0 prompts **"Offline Access Required"**, click **Enable & Continue**.
4. Under **Permissions**, verify **Offline Access** is checked.
5. Scroll to **Calendar**, check **Calendar** and/or **Calendar.Events**.
6. Click **Save Changes**. The yellow *"This connection is using Auth0 development keys"* banner disappears.

![google-oauth2 configured for Authentication and Connected Accounts for Token Vault](docs/screenshots/16-google-social-configured-token-vault.png)

### Checkpoint 2 — Activate the My Account API

`/auth/connect` talks to `https://<YOUR_AUTH0_DOMAIN>/me/v1/connected-accounts`. That is the **My Account API**.

Go to **Applications → APIs** and click **Activate** on the **My Account API** card.

![APIs list — Activate on the My Account API card](docs/screenshots/10-apis-list-initial.png)

After the green toast, you configure permissions from the *application's* **API Access** tab (Checkpoint 4) — even if the system API row does not immediately appear on this APIs list.

### Checkpoint 3 — Enable the Token Vault grant type

**Applications → Applications → Anna's Dog Grooming → Settings → Advanced Settings → Grant Types**

Check **Token Vault**, then click **Save Changes**. Keep **Authorization Code** and **Refresh Token** checked.

![Advanced Settings → Grant Types with Token Vault enabled](docs/screenshots/18-app-grant-types-token-vault-enabled.png)

### Checkpoint 4 — Grant My Account API user-delegated scopes

Still on **Anna's Dog Grooming**, click the **API Access** tab.

Find **Auth0 My Account API (SYSTEM)**. Under **User-delegated Access**, grant the three Connected Accounts permissions:

- `create:me:connected_accounts`
- `read:me:connected_accounts`
- `delete:me:connected_accounts`

The row should read **3 / 8 permissions granted**.

![API Access — Auth0 My Account API with 3 connected_accounts permissions](docs/screenshots/19-app-my-account-api-access.png)

### Pro tips

- **Free plan** includes up to **2 Token Vault connections**. Google counts as one. Don't enable every social provider "just in case."
- This app's Connect button already requests `offline_access` and `https://www.googleapis.com/auth/calendar.events`.
- If Connect fails with a consent or refresh-token error, you are almost always still on Auth0's Google developer keys (Checkpoint 1).
- MFA set to **Always** blocks Token Vault exchanges. Use **Never** for the workshop, or customize MFA with an Action.

---

## Try it

1. Sign in at [http://localhost:3000](http://localhost:3000).
2. Click **Connect Google Calendar** — you should hit Google's consent screen, then land back on `/`.
3. Book a visit (or click **Add Reminder to Calendar** on an existing Phase 1 appointment).
4. The appointment card grows a **View in Google Calendar ↗** badge from the event's `htmlLink`.

If Google isn't connected yet, booking still succeeds. The reminder button explains what the tenant still needs.

---

## Code tour — the Phase 1 diff

### `lib/auth0.ts`

```ts
export const auth0 = new Auth0Client({
  enableConnectAccountEndpoint: true, // mounts /auth/connect
  authorizationParameters: {
    scope: "openid profile email offline_access",
  },
});
```

The Connect button hits:

```
/auth/connect?connection=google-oauth2&returnTo=/&scopes=openid&scopes=profile&scopes=email&scopes=offline_access&scopes=https://www.googleapis.com/auth/calendar.events
```

### `lib/google-calendar.ts`

```ts
const { token } = await auth0.getAccessTokenForConnection({
  connection: "google-oauth2",
});

await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ summary, start, end }),
});
```

The Google refresh token never touches this process. SQLite only stores `calendar_event_id` / `calendar_event_link`.

### `lib/db.ts`

Idempotent migration so a Phase 1 database keeps working:

```ts
await ensureColumn(db, "appointments", "calendar_event_id", "TEXT");
await ensureColumn(db, "appointments", "calendar_event_link", "TEXT");
```

---

## After the workshop / keep building

Phase 2 put reminders on a human's calendar. Phase 3 lets an **AI agent** book as that same customer — OAuth 2.1 + DCR, never a shared API key.

```bash
git checkout phase-3-mcp
npm install
npm run dev
```

---

## Scripts

```bash
npm run dev
npm run build
npm run lint
```
