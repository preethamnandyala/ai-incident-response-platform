'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'

export default function AuthCallbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { setAccessToken, setUser } = useAuthStore()

    useEffect(() => {
        const accessToken = searchParams.get('accessToken')

        if (!accessToken) {
            router.push('/login?error=oauth_failed')
            return
        }

        setAccessToken(accessToken)

        api.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        }).then((response) => {
            setUser(response.data)
            router.push('/dashboard')
        }).catch(() => {
            router.push('/login?error=oauth_failed')
        })
    }, [searchParams, router, setAccessToken, setUser])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-gray-600">Completing sign in...</p>
            </div>
        </div>
    )
}