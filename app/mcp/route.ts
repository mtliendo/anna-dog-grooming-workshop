import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { verifyMcpToken } from "@/lib/auth0-mcp";
import {
  getMcpPublicUrl,
  getMcpResourceUrl,
  isAuth0Configured,
} from "@/lib/config";
import { registerMcpTools } from "@/lib/mcp-tools";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const mcpHandler = createMcpHandler(
  (server) => {
    registerMcpTools(server);
  },
  {
    serverInfo: {
      name: "anna-dog-grooming",
      version: "1.0.0",
    },
  },
);

const authHandler = withMcpAuth(mcpHandler, verifyMcpToken, {
  required: true,
  resourceMetadataPath: "/.well-known/oauth-protected-resource",
  resourceUrl: getMcpPublicUrl(),
});

async function handle(request: Request) {
  if (!isAuth0Configured()) {
    return Response.json(
      {
        error: "workshop_setup_needed",
        error_description:
          "Copy .env.example to .env.local and fill in the Auth0 values before connecting an MCP client.",
        resource: getMcpResourceUrl(),
      },
      {
        status: 503,
        headers: { "WWW-Authenticate": `Bearer resource_metadata="${getMcpPublicUrl()}/.well-known/oauth-protected-resource"` },
      },
    );
  }

  return authHandler(request);
}

export { handle as GET, handle as POST, handle as DELETE };
