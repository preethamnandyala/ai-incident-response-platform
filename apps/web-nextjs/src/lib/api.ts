import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
})

// Request interceptor — attach access token to every request
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Response interceptor — handle 401, try refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const response = await axios.post(
                    `${API_BASE_URL}/api/auth/refresh`,
                    {},
                    { withCredentials: true }
                )

                const { accessToken } = response.data
                useAuthStore.getState().setAccessToken(accessToken)

                originalRequest.headers.Authorization = `Bearer ${accessToken}`
                return api(originalRequest)
            } catch {
                useAuthStore.getState().logout()
                window.location.href = '/login'
                return Promise.reject(error)
            }
        }

        return Promise.reject(error)
    }
)

// Import after to avoid circular dependency
import { useAuthStore } from '@/store/auth.store'