import { UserRecord } from '../src/repositories/user.repository'

export const mockUserRecord: UserRecord = {
    id: '123',
    name: 'Hari',
    email: 'hari@example.com',
    passwordHash: '$2b$10$somehash',
    role: 'DEVELOPER',
    emailVerified: true,
    googleId: null,
    createdAt: new Date(),
    updatedAt: new Date()
}

export const mockVerifiedUser: UserRecord = {
    ...mockUserRecord,
    emailVerified: true,
    googleId: null
}

export const mockUnverifiedUser: UserRecord = {
    ...mockUserRecord,
    emailVerified: false,
    googleId: null
}

export const mockGoogleUser: UserRecord = {
    ...mockUserRecord,
    emailVerified: true,
    googleId: 'google_123',
    passwordHash: ''
}