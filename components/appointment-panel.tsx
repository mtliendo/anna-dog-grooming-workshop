import {
  addCalendarReminderAction,
  bookAppointmentAction,
  cancelAppointmentAction,
} from "@/app/actions";
import type { Appointment, Dog } from "@/lib/db";
import {
  GROOMING_SERVICES,
  TIME_SLOTS,
  formatServiceLine,
  getService,
} from "@/lib/services";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function AppointmentPanel({
  dogs,
  appointments,
}: {
  dogs: Dog[];
  appointments: Appointment[];
}) {
  return (
    <section className="card card-pad">
      <p className="badge">The book</p>
      <h2 className="card-title" style={{ marginTop: 10 }}>
        Grooming appointments
      </h2>
      <p className="muted">
        Booked rows live in the same SQLite file, keyed by your Auth0{" "}
        <span className="mono">sub</span>. Refresh after an agent books one in
        a later phase and it will be sitting right here.
      </p>

      <form action={bookAppointmentAction} className="stack" style={{ marginTop: 18 }}>
        <label className="field">
          <span>Dog</span>
          <select name="dogId" required disabled={dogs.length === 0} defaultValue="">
            <option value="" disabled>
              {dogs.length ? "Choose a dog" : "Register a dog first"}
            </option>
            {dogs.map((dog) => (
              <option key={dog.id} value={dog.id}>
                {dog.name} · {dog.breed}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Service</span>
          <select name="serviceId" required defaultValue={GROOMING_SERVICES[0].id}>
            {GROOMING_SERVICES.map((service) => (
              <option key={service.id} value={service.id}>
                {formatServiceLine(service)}
              </option>
            ))}
          </select>
        </label>
        <div className="grid-2">
          <label className="field">
            <span>Date</span>
            <input type="date" name="date" required min={todayIso()} />
          </label>
          <label className="field">
            <span>Time slot</span>
            <select name="time" required defaultValue={TIME_SLOTS[0]}>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>Notes</span>
          <input name="notes" placeholder="Please text when you arrive" />
        </label>
        <button className="btn btn-primary" type="submit" disabled={dogs.length === 0}>
          Book appointment
        </button>
      </form>

      <div className="stack" style={{ marginTop: 22 }}>
        {appointments.length === 0 ? (
          <div className="empty">
            No visits on the books yet. Pick a service and a time slot above.
          </div>
        ) : (
          appointments.map((appointment) => {
            const service = getService(appointment.service_id);
            return (
              <article key={appointment.id} className="appt-card">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <strong>
                    {appointment.dog_name} · {service?.name ?? appointment.service_id}
                  </strong>
                  <form action={cancelAppointmentAction}>
                    <input
                      type="hidden"
                      name="appointmentId"
                      value={appointment.id}
                    />
                    <button className="btn btn-danger btn-small" type="submit">
                      Cancel
                    </button>
                  </form>
                </div>
                <div className="muted">
                  {appointment.date} at {appointment.time}
                  {service
                    ? ` · ${formatServiceLine(service)}`
                    : null}
                </div>
                {appointment.notes ? (
                  <p className="faint">{appointment.notes}</p>
                ) : null}
                {appointment.calendar_event_link ? (
                  <a
                    className="badge badge-sage"
                    href={appointment.calendar_event_link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View in Google Calendar ↗
                  </a>
                ) : (
                  <form action={addCalendarReminderAction}>
                    <input
                      type="hidden"
                      name="appointmentId"
                      value={appointment.id}
                    />
                    <button className="btn btn-ghost btn-small" type="submit">
                      Add Reminder to Calendar
                    </button>
                  </form>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
