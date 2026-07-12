import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        return axiosError.response?.data?.error || 'Something went wrong'
    }
    return 'Something went wrong'
}
