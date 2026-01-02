import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates an emoji avatar based on the first letter of the name.
 * Fallbacks to 🎵 if name is empty.
 */
export function getInitialIcon(name: string): string {
  if (!name) return "🎵";
  return name.charAt(0).toUpperCase();
}
