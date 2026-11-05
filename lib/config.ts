export const APP_BASE_URL =
  process.env.APP_BASE_URL?.trim() || "http://localhost:3000";

export const WORKSHOP_PHASE = {
  number: 2,
  slug: "token-vault",
  label: "Phase 2 · Token Vault",
} as const;

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
