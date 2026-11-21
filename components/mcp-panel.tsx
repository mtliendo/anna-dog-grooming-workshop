"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const REFRESH_MS = 8000;
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

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
    // Live refresh only while someone is looking, so an idle tab lets Neon scale to zero.
    let lastActive = Date.now();
    const markActive = () => {
      lastActive = Date.now();
    };
    const events = ["pointerdown", "pointermove", "keydown", "focus"] as const;
    for (const name of events) window.addEventListener(name, markActive, { passive: true });
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastActive > ACTIVE_WINDOW_MS) return;
      router.refresh();
    }, REFRESH_MS);
    return () => {
      window.clearInterval(id);
      for (const name of events) window.removeEventListener(name, markActive);
    };
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
