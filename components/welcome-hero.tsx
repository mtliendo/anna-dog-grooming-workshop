import {
  GROOMING_SERVICES,
  formatDuration,
  formatPrice,
} from "@/lib/services";

export function WelcomeHero() {
  return (
    <section className="hero">
      <div>
        <p className="badge badge-terracotta">You&apos;re hired!</p>
        <h1 className="display display-xl" style={{ marginTop: 16 }}>
          Anna just handed you the keys to the salon.
        </h1>
        <p className="lede">
          Customers sign in with Auth0 — email + password or the default Google
          connection — then register their dogs and book a bath, a full groom,
          or a first puppy trim. Every row in SQLite is scoped to{" "}
          <span className="mono">session.user.sub</span>.
        </p>
        <div className="row">
          <a className="btn btn-primary" href="/auth/login?returnTo=/">
            Sign in
          </a>
          <a
            className="btn btn-ghost"
            href="/auth/login?screen_hint=signup&returnTo=/"
          >
            Create a customer account
          </a>
        </div>
      </div>
      <div className="card card-pad">
        <p className="badge">Today&apos;s menu</p>
        <h2 className="card-title" style={{ marginTop: 12 }}>
          Four services, seeded in code.
        </h2>
        <div className="stack" style={{ marginTop: 14 }}>
          {GROOMING_SERVICES.map((service) => (
            <div key={service.id} className="service-tile">
              <strong>{service.name}</strong>
              <span className="muted">
                {formatPrice(service.price)} · {formatDuration(service.durationMin)}
              </span>
              <p className="faint" style={{ margin: "6px 0 0" }}>
                {service.blurb}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
