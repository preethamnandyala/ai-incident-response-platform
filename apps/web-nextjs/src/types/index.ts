export interface User {
    id: string
    name: string
    email: string
    role: 'ADMIN' | 'DEVELOPER' | 'VIEWER'
}

export interface AuthResponse {
    accessToken: string
    user: User
}

export interface ApiError {
    error: string
    details?: Array<{
        field: string
        message: string
    }>
}