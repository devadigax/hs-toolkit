import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "An unknown error occurred."
}

export function formatDateForDisplay(value: unknown, fallback = "-"): string {
  if (typeof value === "string" || typeof value === "number") {
    return new Date(value).toLocaleDateString("en-US")
  }

  return fallback
}
