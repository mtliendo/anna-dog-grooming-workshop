import { NextResponse, type NextRequest } from "next/server";
import { getAuth0 } from "@/lib/auth0";
import { isAuth0Configured } from "@/lib/config";

/**
 * Next.js 16 uses `proxy.ts` (the successor to `middleware.ts`).
 * Auth0 v4 still mounts /auth/login, /auth/logout, /auth/callback, and
 * /auth/profile through `auth0.middleware()`. Until `.env.local` is filled
 * in we pass the request through so the Setup Checklist can render.
 */
export async function proxy(request: NextRequest) {
  if (!isAuth0Configured()) {
    return NextResponse.next();
  }

  return getAuth0().middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|icon.svg).*)",
  ],
};
