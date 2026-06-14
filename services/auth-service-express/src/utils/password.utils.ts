export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/

export const REPEATING_CHARS_REGEX = /(.)\1\1/

export function hasRepeatingCharacters(value: string): boolean {
    return REPEATING_CHARS_REGEX.test(value)
}