import { create } from 'zustand'

interface User {
    id: string
    name: string
    email: string
    role: 'ADMIN' | 'DEVELOPER' | 'VIEWER'
}

interface AuthState {
    accessToken: string | null
    user: User | null
    isAuthenticated: boolean
    setAccessToken: (token: string) => void
    setUser: (user: User) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,
    user: null,
    isAuthenticated: false,

    setAccessToken: (token: string) => set({
        accessToken: token,
        isAuthenticated: true
    }),

    setUser: (user: User) => set({ user }),

    logout: () => set({
        accessToken: null,
        user: null,
        isAuthenticated: false
    })
}))