import { AppointmentPanel } from "@/components/appointment-panel";
import { CalendarCard } from "@/components/calendar-card";
import { DogPanel } from "@/components/dog-panel";
import { SetupChecklist } from "@/components/setup-checklist";
import { WelcomeHero } from "@/components/welcome-hero";
import { getSessionSafe } from "@/lib/auth0";
import { getEnvChecklist, isAuth0Configured } from "@/lib/config";
import { listAppointments, listDogs } from "@/lib/db";
import { isGoogleCalendarConnected } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!isAuth0Configured()) {
    return <SetupChecklist items={getEnvChecklist()} />;
  }

  const session = await getSessionSafe();
  if (!session?.user?.sub) {
    return <WelcomeHero />;
  }

  const [dogs, appointments, calendarConnected] = await Promise.all([
    listDogs(session.user.sub),
    listAppointments(session.user.sub),
    isGoogleCalendarConnected(),
  ]);

  return (
    <>
      <section style={{ marginBottom: 22 }}>
        <p className="badge badge-sage">Auth0 Verified</p>
        <h1 className="display display-lg" style={{ marginTop: 12 }}>
          Welcome back{session.user.given_name ? `, ${session.user.given_name}` : ""}.
        </h1>
        <p className="lede">
          These dogs and appointments belong only to{" "}
          <span className="mono">{session.user.sub}</span>. Another customer
          signing in on this laptop will see an empty book — that&apos;s the
          isolation story for this hour.
        </p>
      </section>
      <CalendarCard
        connected={calendarConnected}
        email={session.user.email}
      />
      <div className="grid-2">
        <DogPanel dogs={dogs} />
        <AppointmentPanel dogs={dogs} appointments={appointments} />
      </div>
    </>
  );
}
