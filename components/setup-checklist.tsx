import {
  getCallbackUrl,
  getLogoutUrl,
  type EnvStatus,
} from "@/lib/config";
import { StatusDot } from "@/components/icons";

export function SetupChecklist({ items }: { items: EnvStatus[] }) {
  const missing = items.filter((item) => !item.configured);
  const callback = getCallbackUrl();
  const logout = getLogoutUrl();

  return (
    <section className="card card-pad">
      <p className="badge badge-terracotta">Workshop Setup Needed</p>
      <h1 className="display display-lg" style={{ marginTop: 14 }}>
        Copy <span className="mono">.env.example</span> to{" "}
        <span className="mono">.env.local</span>, then paste your Auth0 app
        values.
      </h1>
      <p className="lede">
        The salon software is ready — it just needs a Regular Web Application
        from your Auth0 tenant. Nothing crashes while these are empty; this
        checklist stays here until every required value is real.
      </p>

      <ol className="setup-list">
        {items.map((item) => (
          <li
            key={item.name}
            className={`setup-item ${item.configured ? "ok" : "missing"}`}
          >
            <StatusDot ok={item.configured} />
            <div>
              <div className="row">
                <strong className="mono">{item.name}</strong>
                <span className={item.configured ? "badge badge-sage" : "badge"}>
                  {item.configured ? "Set" : "Missing"}
                </span>
              </div>
              <p className="muted" style={{ margin: "6px 0 0" }}>
                {item.hint}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="stack" style={{ marginTop: 22 }}>
        <div>
          <p className="muted" style={{ margin: "0 0 8px" }}>
            Generate a session secret
          </p>
          <pre className="pre">openssl rand -hex 32</pre>
        </div>
        <div>
          <p className="muted" style={{ margin: "0 0 8px" }}>
            Paste these on the Auth0 app&apos;s <strong>URLs</strong> tab (next
            to Settings). Press <span className="mono">Enter</span> after each
            one so it becomes a chip with a <strong>DEV</strong> badge, then
            click <strong>Save</strong> in the floating &quot;You have unsaved
            changes&quot; bar.
          </p>
          <pre className="pre">{`Allowed Callback URLs
${callback}

Allowed Logout URLs
${logout}

Allowed Web Origins (CORS)
${logout}`}</pre>
        </div>
        {missing.length > 0 ? (
          <p className="faint">
            Still empty:{" "}
            <span className="mono">{missing.map((item) => item.name).join(", ")}</span>
            . After saving <span className="mono">.env.local</span>, restart{" "}
            <span className="mono">npm run dev</span>.
          </p>
        ) : null}
      </div>
    </section>
  );
}
