import {
  generateProtectedResourceMetadata,
  metadataCorsOptionsRequestHandler,
} from "mcp-handler";
import { getAuth0Issuer, getMcpResourceUrl, MCP_SCOPES } from "@/lib/config";

export const dynamic = "force-dynamic";

function handler() {
  const issuer = getAuth0Issuer();
  const metadata = generateProtectedResourceMetadata({
    authServerUrls: issuer ? [issuer] : ["https://your-tenant.us.auth0.com/"],
    resourceUrl: getMcpResourceUrl(),
    additionalMetadata: {
      scopes_supported: [...MCP_SCOPES],
      bearer_methods_supported: ["header"],
    },
  });

  return Response.json(metadata, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, MCP-Protocol-Version",
      "Cache-Control": "no-store",
    },
  });
}

const optionsHandler = metadataCorsOptionsRequestHandler();

export { handler as GET, optionsHandler as OPTIONS };
