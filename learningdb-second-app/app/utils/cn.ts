type ClassValue = string | false | null | undefined;

/** Lightweight className joiner (filters falsy values). */
export function cn(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(" ");
}
