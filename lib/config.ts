export const APP_BASE_URL =
  process.env.APP_BASE_URL?.trim() || "http://localhost:3000";

export const WORKSHOP_PHASE = {
  number: 3,
  slug: "secure-mcp",
  label: "Phase 3 · Secure MCP",
} as const;

export const MCP_SCOPES = ["bookings:read", "bookings:write"] as const;

export function getMcpPublicUrl(): string {
  const raw =
    process.env.MCP_PUBLIC_URL?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export function getMcpResourceUrl(): string {
  return process.env.AUTH0_MCP_AUDIENCE?.trim() || `${getMcpPublicUrl()}/mcp`;
}

export function getAuth0Issuer(): string | null {
  const domain = process.env.AUTH0_DOMAIN?.trim();
  if (!domain || domain.toLowerCase().includes("your-tenant")) return null;
  return `https://${domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}/`;
}

export const GOOGLE_CONNECTION = "google-oauth2";
export const GOOGLE_CALENDAR_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "https://www.googleapis.com/auth/calendar.events",
] as const;

export function getGoogleConnectUrl(returnTo = "/"): string {
  const params = new URLSearchParams();
  params.set("connection", GOOGLE_CONNECTION);
  params.set("returnTo", returnTo);
  for (const scope of GOOGLE_CALENDAR_SCOPES) {
    params.append("scopes", scope);
  }
  return `/auth/connect?${params.toString()}`;
}

const PLACEHOLDERS: Record<string, string[]> = {
  AUTH0_SECRET: ["replace-with-openssl-rand-hex-32", "change-me"],
  AUTH0_DOMAIN: ["your-tenant", "example.auth0.com"],
  AUTH0_CLIENT_ID: ["your-client-id"],
  AUTH0_CLIENT_SECRET: ["your-client-secret"],
};

export type EnvStatus = {
  name: string;
  required: boolean;
  configured: boolean;
  hint: string;
};

function isConfigured(name: string, value: string | undefined): boolean {
  if (!value || value.trim() === "") return false;
  const needles = PLACEHOLDERS[name] ?? [];
  const lower = value.toLowerCase();
  return !needles.some((needle) => lower.includes(needle.toLowerCase()));
}

export function getEnvChecklist(): EnvStatus[] {
  return [
    {
      name: "AUTH0_SECRET",
      required: true,
      configured: isConfigured("AUTH0_SECRET", process.env.AUTH0_SECRET),
      hint: "Generate with `openssl rand -hex 32`",
    },
    {
      name: "APP_BASE_URL",
      required: true,
      configured: Boolean(process.env.APP_BASE_URL?.trim()),
      hint: "Defaults to http://localhost:3000 if you copy .env.example",
    },
    {
      name: "AUTH0_DOMAIN",
      required: true,
      configured: isConfigured("AUTH0_DOMAIN", process.env.AUTH0_DOMAIN),
      hint: "Tenant domain only — e.g. dev-abc123.us.auth0.com (no https://)",
    },
    {
      name: "AUTH0_CLIENT_ID",
      required: true,
      configured: isConfigured("AUTH0_CLIENT_ID", process.env.AUTH0_CLIENT_ID),
      hint: "From your Regular Web Application in the Auth0 Dashboard",
    },
    {
      name: "AUTH0_CLIENT_SECRET",
      required: true,
      configured: isConfigured(
        "AUTH0_CLIENT_SECRET",
        process.env.AUTH0_CLIENT_SECRET,
      ),
      hint: "From the same Regular Web Application settings tab",
    },
    {
      name: "MCP_PUBLIC_URL",
      required: false,
      configured: Boolean(process.env.MCP_PUBLIC_URL?.trim()),
      hint: "Optional. Defaults to APP_BASE_URL. Set to your ngrok/cloudflared URL for cloud agents.",
    },
    {
      name: "AUTH0_MCP_AUDIENCE",
      required: false,
      configured: Boolean(process.env.AUTH0_MCP_AUDIENCE?.trim()),
      hint: "Optional. Defaults to {MCP_PUBLIC_URL}/mcp — must match the Auth0 API Identifier.",
    },
  ];
}

export function isAuth0Configured(): boolean {
  return getEnvChecklist()
    .filter((item) => item.required)
    .every((item) => item.configured);
}

export function getCallbackUrl(): string {
  return `${APP_BASE_URL.replace(/\/$/, "")}/auth/callback`;
}

export function getLogoutUrl(): string {
  return APP_BASE_URL.replace(/\/$/, "");
}
