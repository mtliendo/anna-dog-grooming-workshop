import { getGoogleConnectUrl } from "@/lib/config";

export function CalendarCard({
  connected,
  email,
}: {
  connected: boolean;
  email?: string | null;
}) {
  const connectHref = getGoogleConnectUrl("/");

  return (
    <section
      className={`card card-pad ${connected ? "card-sage" : "card-amber"}`}
      style={{ marginBottom: 22 }}
    >
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <p className={connected ? "badge badge-sage" : "badge badge-terracotta"}>
            {connected ? "Connected" : "Not connected"}
          </p>
          <h2 className="card-title" style={{ marginTop: 10 }}>
            Google Calendar
          </h2>
          <p className="muted" style={{ margin: 0, maxWidth: "62ch" }}>
            {connected
              ? "Auth0 Token Vault is holding a Google refresh token for this customer. Booking a visit — or clicking Add Reminder — writes a real event on their primary calendar. This app never stores the Google token in SQLite."
              : "Anna wants reminders on the customer's own Google Calendar. Connect once; Auth0 Token Vault keeps the Google tokens. If this fails with Auth0's default Google developer keys, that's expected — Phase 2 needs your own Google Cloud OAuth client."}
          </p>
          {email ? (
            <p className="faint" style={{ margin: "8px 0 0" }}>
              Connect hint: <span className="mono">{email}</span>
            </p>
          ) : null}
        </div>
        <a className="btn btn-primary" href={connectHref}>
          {connected ? "Reconnect Google Calendar" : "Connect Google Calendar"}
        </a>
      </div>
    </section>
  );
}
