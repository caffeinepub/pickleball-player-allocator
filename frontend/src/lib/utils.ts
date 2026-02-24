import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function formatDuprRating(rating: number | null | undefined): string {
  if (rating === null || rating === undefined) return "Unrated";
  return rating.toFixed(2) + " DUPR";
}

export function shortenPrincipal(principal: string): string {
  if (!principal) return "";
  if (principal.length <= 12) return principal;
  return principal.slice(0, 6) + "..." + principal.slice(-4);
}
