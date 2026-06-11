import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const PERU_TIME_ZONE = "America/Lima";
export const PERU_LOCALE = "es-PE";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMatchDate(value: string) {
  const formatted = new Intl.DateTimeFormat(PERU_LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: PERU_TIME_ZONE,
  }).format(new Date(value));

  return `${formatted} hora Peru`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("es").format(value);
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getTimeUntil(value: string, now: number = Date.now()) {
  const diff = new Date(value).getTime() - now;

  if (diff <= 0) {
    return "Bloqueado";
  }

  const dayMs = 1000 * 60 * 60 * 24;
  const hourMs = 1000 * 60 * 60;
  const minuteMs = 1000 * 60;
  const days = Math.floor(diff / dayMs);
  const hours = Math.floor((diff % dayMs) / hourMs);
  const minutes = Math.floor((diff % hourMs) / minuteMs);

  if (days > 0) {
    return `${days} ${days === 1 ? "dia" : "dias"}${hours ? ` ${hours}h` : ""}`;
  }

  if (Math.floor(diff / hourMs) > 0) {
    return `${Math.floor(diff / hourMs)}h ${minutes}m`;
  }

  return `${Math.max(Math.ceil(diff / minuteMs), 1)}m`;
}
