"use server";

import { revalidatePath } from "next/cache";
import { getSessionSafe } from "@/lib/auth0";
import {
  addDog,
  addSampleDog,
  bookAppointment,
  cancelAppointment,
  deleteDog,
} from "@/lib/db";

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

  await bookAppointment(sub, { dogId, serviceId, date, time, notes });
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
