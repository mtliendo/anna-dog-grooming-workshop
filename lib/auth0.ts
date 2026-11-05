import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { isAuth0Configured } from "@/lib/config";

/**
 * Auth0 v4 client — constructed only after `.env.local` is filled in.
 *
 * The workshop home page renders a Setup Checklist instead of calling this
 * when placeholders are still present, so a missing env file never becomes
 * an unhandled 500.
 */
let client: Auth0Client | null = null;

export function getAuth0(): Auth0Client {
  if (!isAuth0Configured()) {
    throw new Error(
      "Auth0 is not configured yet. Copy .env.example to .env.local and fill in your tenant values.",
    );
  }

  if (!client) {
    client = new Auth0Client({
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      secret: process.env.AUTH0_SECRET,
      appBaseUrl: process.env.APP_BASE_URL,
      authorizationParameters: {
        scope: "openid profile email",
      },
    });
  }

  return client;
}

export async function getSessionSafe() {
  if (!isAuth0Configured()) return null;
  return getAuth0().getSession();
}
