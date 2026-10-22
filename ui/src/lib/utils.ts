import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong"
): string {
  if (error && typeof error === "object") {
    const response = (error as { response?: { data?: unknown } }).response;
    const data = response?.data as
      | { message?: unknown; error?: unknown }
      | undefined;

    if (data && typeof data.message === "string" && data.message) {
      return data.message;
    }

    if (data && typeof data.error === "string" && data.error) {
      return data.error;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
