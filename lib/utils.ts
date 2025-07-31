import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { FETCH_RETRY_ATTEMPTS, INITIAL_BACKOFF_MS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------- Utility Functions ----------
export async function fetchWithRetry<T = any>(
  url: string,
  attempts = FETCH_RETRY_ATTEMPTS,
  backoffMs = INITIAL_BACKOFF_MS,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      console.log("res", res);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      // exponential backoff before next try, but don't wait after last attempt
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, backoffMs * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}
