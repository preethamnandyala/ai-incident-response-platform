import { Suspense } from 'react'
import AuthCallbackContent from './AuthCallbackContent'

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-gray-600">Completing sign in...</p>
                </div>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    )
}