import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${url} ${res.status}: ${text.slice(0, 200)}`);
  }
  return JSON.parse(text) as T;
}
