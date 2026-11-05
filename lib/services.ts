export type GroomingService = {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  blurb: string;
};

export const GROOMING_SERVICES: GroomingService[] = [
  {
    id: "bath-brush",
    name: "Bath & Brush",
    price: 55,
    durationMin: 45,
    blurb: "A warm bath, thorough brush-out, and ear clean.",
  },
  {
    id: "full-groom",
    name: "Full Groom",
    price: 85,
    durationMin: 90,
    blurb: "Breed-standard cut, bath, nails, and a finishing spritz.",
  },
  {
    id: "puppy-intro",
    name: "Puppy Intro Trim",
    price: 45,
    durationMin: 30,
    blurb: "Gentle first visit — face, paws, and sanitary tidy.",
  },
  {
    id: "nail-paw",
    name: "Nail & Paw Spa",
    price: 25,
    durationMin: 20,
    blurb: "Nail trim, paw pad tidy, and a little paw balm.",
  },
];

export const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
] as const;

export const SAMPLE_DOG = {
  name: "Barnaby",
  breed: "Golden Doodle",
  notes: "Loves a slow brush and peanut-butter treats.",
} as const;

export function getService(id: string): GroomingService | undefined {
  return GROOMING_SERVICES.find((service) => service.id === id);
}

export function formatPrice(dollars: number): string {
  return `$${dollars}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function formatServiceLine(service: GroomingService): string {
  return `${service.name} ($${service.price} · ${service.durationMin}m)`;
}
