"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function McpPanel({
  endpoint,
  audience,
  scopes,
}: {
  endpoint: string;
  audience: string;
  scopes: readonly string[];
}) {
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), 8000);
    return () => window.clearInterval(id);
  }, [router]);

  return (
    <section className="card card-pad mcp-panel">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <p className="badge badge-sage">MCP Server Ready</p>
          <h2 className="card-title" style={{ marginTop: 10 }}>
            Agents book as the customer — never a shared API key.
          </h2>
          <p className="muted" style={{ margin: "0 0 12px", maxWidth: "68ch" }}>
            Point Cursor, Claude, MCP Inspector, or a cloud agent at the
            endpoint below. Missing tokens get a 401 with{" "}
            <span className="mono">WWW-Authenticate</span> so the client starts
            Auth0 OAuth + consent automatically.
          </p>
          <p className="mono faint" style={{ margin: "0 0 6px" }}>
            {endpoint}
          </p>
          <p className="mono faint" style={{ margin: "0 0 10px" }}>
            audience {audience}
          </p>
          <div className="row">
            {scopes.map((scope) => (
              <span key={scope} className="badge">
                {scope}
              </span>
            ))}
          </div>
        </div>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => router.refresh()}
        >
          Refresh
        </button>
      </div>
    </section>
  );
}
