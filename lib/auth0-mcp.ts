import { ApiClient, VerifyAccessTokenError } from "@auth0/auth0-api-js";
import type { AuthInfo } from "@modelcontextprotocol/server";
import {
  getAuth0Issuer,
  getMcpPublicUrl,
  getMcpResourceUrl,
  isAuth0Configured,
  MCP_SCOPES,
} from "@/lib/config";

let apiClient: ApiClient | null = null;

export function getMcpApiClient(): ApiClient {
  if (!isAuth0Configured()) {
    throw new Error("Auth0 is not configured yet.");
  }

  if (!apiClient) {
    apiClient = new ApiClient({
      domain: process.env.AUTH0_DOMAIN!.replace(/^https?:\/\//, "").replace(
        /\/$/,
        "",
      ),
      audience: getMcpResourceUrl(),
    });
  }

  return apiClient;
}

export function buildProtectedResourceMetadata() {
  const issuer = getAuth0Issuer();
  const resourceUrl = getMcpResourceUrl();

  return {
    resource: resourceUrl,
    authorization_servers: issuer ? [issuer] : [],
    bearer_methods_supported: ["header"],
    scopes_supported: [...MCP_SCOPES],
    resource_documentation: `${getMcpPublicUrl()}/`,
  };
}

export async function verifyMcpToken(
  _req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  if (!bearerToken || !isAuth0Configured()) return undefined;

  try {
    const claims = await getMcpApiClient().verifyAccessToken({
      accessToken: bearerToken,
    });

    const scopes =
      typeof claims.scope === "string"
        ? claims.scope.split(" ").filter(Boolean)
        : [];

    const clientId =
      (typeof claims.azp === "string" && claims.azp) ||
      (typeof (claims as { client_id?: unknown }).client_id === "string"
        ? String((claims as { client_id?: string }).client_id)
        : "unknown");

    if (!claims.sub) return undefined;

    return {
      token: bearerToken,
      clientId,
      scopes,
      expiresAt: claims.exp,
      extra: { sub: claims.sub },
    };
  } catch (error) {
    if (error instanceof VerifyAccessTokenError) {
      return undefined;
    }
    throw error;
  }
}

export function getSubFromAuth(auth: AuthInfo): string {
  const sub = auth.extra?.sub;
  if (typeof sub !== "string" || !sub) {
    throw new Error("Access token is missing the sub claim.");
  }
  return sub;
}
