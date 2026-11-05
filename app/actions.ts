"use server";

import { revalidatePath } from "next/cache";
import { getSessionSafe } from "@/lib/auth0";
import {
  addDog,
  addSampleDog,
  bookAppointment,
  cancelAppointment,
  deleteDog,
  getAppointment,
  saveCalendarEvent,
} from "@/lib/db";
import {
  CalendarNotConnectedError,
  createAppointmentReminder,
  explainCalendarError,
  getGoogleAccessToken,
} from "@/lib/google-calendar";

async function requireSub() {
  const session = await getSessionSafe();
  const sub = session?.user?.sub;
  if (!sub) {
    throw new Error("Please sign in to manage your dogs.");
  }
  return sub;
}

export async function addDogAction(formData: FormData) {
  const sub = await requireSub();
  const name = String(formData.get("name") ?? "").trim();
  const breed = String(formData.get("breed") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name || !breed) {
    throw new Error("Name and breed are required.");
  }

  await addDog(sub, { name, breed, notes });
  revalidatePath("/");
}

export async function addSampleDogAction() {
  const sub = await requireSub();
  await addSampleDog(sub);
  revalidatePath("/");
}

export async function deleteDogAction(formData: FormData) {
  const sub = await requireSub();
  const dogId = Number(formData.get("dogId"));
  if (!dogId) {
    throw new Error("Missing dog id.");
  }
  await deleteDog(sub, dogId);
  revalidatePath("/");
}

export async function bookAppointmentAction(formData: FormData) {
  const sub = await requireSub();
  const dogId = Number(formData.get("dogId"));
  const serviceId = String(formData.get("serviceId") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!dogId || !serviceId || !date || !time) {
    throw new Error("Pick a dog, a service, a date, and a time slot.");
  }

  const appointment = await bookAppointment(sub, {
    dogId,
    serviceId,
    date,
    time,
    notes,
  });

  // Best-effort: if Token Vault already has a Google token, drop the reminder
  // on the calendar. Booking still succeeds if Calendar isn't connected yet.
  try {
    const token = await getGoogleAccessToken();
    const hydrated = await getAppointment(sub, appointment.id);
    if (hydrated) {
      const event = await createAppointmentReminder(token, hydrated);
      await saveCalendarEvent(sub, appointment.id, event);
    }
  } catch (error) {
    if (!(error instanceof CalendarNotConnectedError)) {
      console.warn("Calendar reminder skipped:", explainCalendarError(error));
    }
  }

  revalidatePath("/");
}

export async function cancelAppointmentAction(formData: FormData) {
  const sub = await requireSub();
  const appointmentId = Number(formData.get("appointmentId"));
  if (!appointmentId) {
    throw new Error("Missing appointment id.");
  }
  await cancelAppointment(sub, appointmentId);
  revalidatePath("/");
}

export async function addCalendarReminderAction(formData: FormData) {
  const sub = await requireSub();
  const appointmentId = Number(formData.get("appointmentId"));
  if (!appointmentId) {
    throw new Error("Missing appointment id.");
  }

  const appointment = await getAppointment(sub, appointmentId);
  if (!appointment) {
    throw new Error("That appointment is not on your book.");
  }

  try {
    const token = await getGoogleAccessToken();
    const event = await createAppointmentReminder(token, appointment);
    await saveCalendarEvent(sub, appointmentId, event);
  } catch (error) {
    throw new Error(explainCalendarError(error));
  }

  revalidatePath("/");
}
