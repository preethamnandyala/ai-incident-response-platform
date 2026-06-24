import crypto from 'crypto'

export function generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString()
}

export function hashOTP(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex')
}

export function compareOTP(plainOTP: string, hashedOTP: string): boolean {
    const hashedAttempt = hashOTP(plainOTP)
    return hashedAttempt === hashedOTP
}