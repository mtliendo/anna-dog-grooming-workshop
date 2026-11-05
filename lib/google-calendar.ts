import { AccessTokenForConnectionError } from "@auth0/nextjs-auth0/errors";
import { getAuth0 } from "@/lib/auth0";
import { GOOGLE_CONNECTION } from "@/lib/config";
import { formatServiceLine, getService } from "@/lib/services";
import type { Appointment } from "@/lib/db";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export type CalendarEvent = {
  id: string;
  htmlLink: string;
  summary?: string;
};

export const GOOGLE_DEV_KEYS_TIP =
  "Auth0's built-in Google developer keys can sign a user in, but they do not issue refresh tokens and cannot be used with Token Vault. In the Auth0 Dashboard, swap the Google connection for your own Google Cloud OAuth Client ID + Secret, enable Token Vault + Connected Accounts + Offline Access, and authorize the My Account API Connected Accounts scopes.";

export class CalendarNotConnectedError extends Error {
  constructor(message = "Google Calendar is not connected yet.") {
    super(message);
    this.name = "CalendarNotConnectedError";
  }
}

export function explainCalendarError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (
    error instanceof AccessTokenForConnectionError ||
    lower.includes("access token") ||
    lower.includes("not connected") ||
    lower.includes("refresh token") ||
    lower.includes("consent")
  ) {
    return `${message} ${GOOGLE_DEV_KEYS_TIP}`;
  }

  if (lower.includes("invalid_client") || lower.includes("unauthorized_client")) {
    return `${message} ${GOOGLE_DEV_KEYS_TIP}`;
  }

  return message;
}

export async function getGoogleAccessToken(): Promise<string> {
  try {
    const { token } = await getAuth0().getAccessTokenForConnection({
      connection: GOOGLE_CONNECTION,
    });
    return token;
  } catch (error) {
    throw new CalendarNotConnectedError(explainCalendarError(error));
  }
}

export async function isGoogleCalendarConnected(): Promise<boolean> {
  try {
    await getGoogleAccessToken();
    return true;
  } catch {
    return false;
  }
}

function appointmentDateTimes(appointment: Appointment) {
  const service = getService(appointment.service_id);
  const durationMin = service?.durationMin ?? 45;
  const start = new Date(`${appointment.date}T${appointment.time}:00`);
  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles";

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    timeZone,
    service,
  };
}

export async function createAppointmentReminder(
  accessToken: string,
  appointment: Appointment,
): Promise<CalendarEvent> {
  const { start, end, timeZone, service } = appointmentDateTimes(appointment);
  const dogName = appointment.dog_name ?? "your dog";
  const summary = service
    ? `${service.name} for ${dogName}`
    : `Grooming for ${dogName}`;

  const res = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary,
      description: [
        "Anna's Dog Grooming appointment",
        service ? formatServiceLine(service) : appointment.service_id,
        appointment.notes ? `Notes: ${appointment.notes}` : null,
        "Reminder created via Auth0 Token Vault — this app never stored your Google refresh token.",
      ]
        .filter(Boolean)
        .join("\n"),
      start: { dateTime: start, timeZone },
      end: { dateTime: end, timeZone },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Google Calendar API error ${res.status}: ${detail}`);
  }

  return (await res.json()) as CalendarEvent;
}
