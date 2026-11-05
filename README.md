# Anna's Dog Grooming — Phase 3

**Secure MCP server for AI agents** · built on Phase 1 + Phase 2.

Anna's customers want Grok, Cursor, Claude Desktop, or Claude Code to manage their dogs and book visits **as them**. No shared static API key. The agent is an OAuth 2.1 client that dynamically registers with Auth0, the customer consents, and every tool call is scoped to the `sub` on the verified JWT.

```bash
git checkout phase-3-mcp
npm install
npm run dev
```

The salon UI, SQLite file, and Google Calendar reminders from earlier phases keep working.

---

## Architecture

```mermaid
sequenceDiagram
  participant Agent as AI agent
  participant PRM as /.well-known/oauth-protected-resource
  participant Auth0 as Auth0 (DCR + consent)
  participant MCP as /mcp
  participant DB as SQLite (user_sub)

  Agent->>MCP: tools/call (no token)
  MCP-->>Agent: 401 WWW-Authenticate resource_metadata=...
  Agent->>PRM: GET RFC 9728 metadata
  PRM-->>Agent: resource + authorization_servers + scopes
  Agent->>Auth0: DCR (or CIMD) + browser login + consent
  Auth0-->>Agent: JWT access token (aud=/mcp, sub=customer)
  Agent->>MCP: Authorization Bearer JWT
  MCP->>MCP: ApiClient.verifyAccessToken
  MCP->>DB: list / insert WHERE user_sub = sub
  Note over DB: Refresh localhost:3000 — the new row is already there
```

| Piece | Role |
| --- | --- |
| `app/mcp/route.ts` | Streamable MCP endpoint |
| `app/.well-known/oauth-protected-resource` | RFC 9728 metadata (root) |
| `app/.well-known/oauth-protected-resource/mcp` | RFC 9728 metadata for resource `…/mcp` |
| `@auth0/auth0-api-js` `ApiClient` | JWKS verification of `iss`, `aud`, `exp` |
| `mcp-handler` `withMcpAuth` | 401 + `WWW-Authenticate: Bearer resource_metadata="…"` |

---

## Local vs tunnel

| Who | `MCP_PUBLIC_URL` | Audience / API Identifier |
| --- | --- | --- |
| Self-paced (Cursor, Claude Code, Inspector) | *(omit — defaults to `APP_BASE_URL`)* | `http://localhost:3000/mcp` |
| Speaker / cloud agent (Grok Bot) | `https://xyz.trycloudflare.com` | `https://xyz.trycloudflare.com/mcp` |

Web login stays on `http://localhost:3000`. Only the MCP resource identifier changes for the tunnel.

```
MCP_PUBLIC_URL=https://xyz.trycloudflare.com
AUTH0_MCP_AUDIENCE=https://xyz.trycloudflare.com/mcp
```

---

## Auth0 Dashboard setup

Do this by hand. Toggles auto-save unless noted.

### 1. Enable Dynamic Client Registration (and CIMD)

**Settings → Advanced**

- Enable **Dynamic Client Registration (DCR)**
- Enable **OIDC Dynamic Application Registration** / **CIMD** if the toggle is present

The 2026 MCP spec prefers Client ID Metadata Documents; DCR stays as the workshop-friendly fallback.

### 2. Promote the database connection to domain level

**Authentication → Database → Username-Password-Authentication**

1. Open **Applications** (or the connection settings) and **Promote to Domain Level**.
2. Scroll to the bottom and click **Save**.

Dynamically registered third-party MCP clients cannot use a connection that is only enabled for *Anna's Dog Grooming*. Domain-level is what lets Cursor / Claude / Inspector actually log the customer in.

### 3. Create the API

**Applications → APIs → Create API**

| Field | Value |
| --- | --- |
| Name | `Anna's Dog Grooming MCP` |
| Identifier | `http://localhost:3000/mcp` (or your tunnel URL + `/mcp`) |
| Profile | **Auth0 / RFC 9068** |
| Signing | RS256 |

**Permissions**

| Permission | Description |
| --- | --- |
| `bookings:read` | List dogs and appointments |
| `bookings:write` | Add a dog or book a visit |

### 4. Access Policies — the Pro Tip everyone misses

On the API:

1. **Access Policies** → **User-delegated access** → **All applications allowed**.
2. **Default Permissions for third-party applications** → set to **Authorized**.
3. Select **`bookings:read`** and **`bookings:write`**.

> **Pro tip:** this defaults to **Unauthorized**. If you skip it, MCP clients register fine, the customer logs in, and the token arrives with **zero** bookings scopes. Selecting the scopes here is what lets DCR clients request them.

### 5. Free-plan hygiene

Each MCP client that dynamically registers counts as **1 application** toward the Free plan's **10-app** limit. Periodically delete unused DCR clients under **Applications**.

---

## Four tools, scoped to `sub`

| Tool | Scope | What it does |
| --- | --- | --- |
| `list_dogs` | `bookings:read` | Customer's dogs + the service menu |
| `add_dog` | `bookings:write` | `name`, `breed`, optional `notes` |
| `list_appointments` | `bookings:read` | Upcoming visits |
| `book_appointment` | `bookings:write` | `dog_name`, `service`, `date`, `time`, optional `notes` |

Every query is `WHERE user_sub = ?` using the JWT `sub`. Book with an agent, click **Refresh** (or wait 8 seconds) on [http://localhost:3000](http://localhost:3000) — the appointment is already in the web UI.

---

## Client snippets

### Cursor — `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "anna-dog-grooming": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

Cursor discovers Auth0 from `/.well-known/oauth-protected-resource`, registers, and opens the browser.

### MCP Inspector

```bash
npx @modelcontextprotocol/inspector
```

Connect to `http://localhost:3000/mcp` with transport **Streamable HTTP**. The inspector will follow the 401 + resource metadata into Auth0.

### Claude Desktop / Claude Code

```json
{
  "mcpServers": {
    "anna-dog-grooming": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### Cloud agents (Grok Bot)

```bash
npx cloudflared tunnel --url http://localhost:3000
```

Then in `.env.local`:

```
MCP_PUBLIC_URL=https://YOUR-TUNNEL.trycloudflare.com
AUTH0_MCP_AUDIENCE=https://YOUR-TUNNEL.trycloudflare.com/mcp
```

Create (or update) the Auth0 API Identifier to that same audience, add `https://YOUR-TUNNEL.trycloudflare.com/auth/callback` to Allowed Callback URLs only if the *web* login also goes through the tunnel. For MCP-only tunnels, the API Identifier is the important match.

---

## Extra credit / after the workshop

Phase 2 already writes calendar reminders from the **web** session via Token Vault. Want `book_appointment` in MCP to do the same?

Auth0 can exchange the **incoming MCP access token** for a Google token without this app storing anything:

```ts
import { ApiClient } from "@auth0/auth0-api-js";

const api = new ApiClient({
  domain: process.env.AUTH0_DOMAIN!,
  audience: process.env.AUTH0_MCP_AUDIENCE!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
});

const { accessToken: google } = await api.getAccessTokenForConnection({
  connection: "google-oauth2",
  accessToken: incomingMcpJwt, // the agent's bearer token
});
```

Dashboard extras for this exchange:

1. The MCP API needs a **Custom API Client** (Applications → APIs → Anna's Dog Grooming MCP → Add Application) with the **Token Vault** grant.
2. The customer must have already clicked **Connect Google Calendar** in Phase 2 (or you initiate Connected Accounts from the agent).
3. Call `createAppointmentReminder` from `lib/google-calendar.ts` with that Google access token, then `saveCalendarEvent`.

Same SQLite row, same `htmlLink` badge — now written by the agent.

---

## Code tour

- `lib/auth0-mcp.ts` — `ApiClient({ domain, audience })` + `verifyAccessToken({ accessToken })`
- `app/mcp/route.ts` — `createMcpHandler` + `withMcpAuth(..., { required: true })`
- `lib/mcp-tools.ts` — four tools, `requireScopes("bookings:read"|"bookings:write")`, `sub` isolation
- Well-known routes reuse `generateProtectedResourceMetadata` from `mcp-handler`

---

## Scripts

```bash
npm run dev
npm run build
npm run lint
```
