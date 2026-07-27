'use client'
import { useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'

function VerifyEmailContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email') || ''
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [isLoading, setIsLoading] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) return
        if (!/^\d*$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').slice(0, 6)
        if (!/^\d+$/.test(pasted)) return
        const newOtp = [...otp]
        pasted.split('').forEach((char, i) => {
            if (i < 6) newOtp[i] = char
        })
        setOtp(newOtp)
        inputRefs.current[Math.min(pasted.length, 5)]?.focus()
    }

    const handleVerify = async () => {
        const code = otp.join('')
        if (code.length !== 6) {
            toast.error('Please enter the 6-digit code')
            return
        }

        setIsLoading(true)
        try {
            await api.post('/api/auth/verify-email', {
                email,
                otp: code
            })
            toast.success('Email verified successfully!')
            router.push('/login')
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Invalid or expired code')
            setOtp(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
        } finally {
            setIsLoading(false)
        }
    }

    const handleResend = async () => {
        setIsResending(true)
        try {
            await api.post('/api/auth/resend-verification', { email })
            toast.success('New verification code sent!')
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to resend code')
        } finally {
            setIsResending(false)
        }
    }

    return (
        <Card>
            <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-white">
                            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                    </div>
                    <span className="font-bold text-xl">IncidentAI</span>
                </div>
                <CardTitle>Verify your email</CardTitle>
                <CardDescription>
                    We sent a 6-digit code to{' '}
                    <span className="font-medium text-gray-900">{email}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-2 justify-center">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={el => { inputRefs.current[index] = el }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleChange(index, e.target.value)}
                            onKeyDown={e => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none transition-colors"
                        />
                    ))}
                </div>

                <Button
                    className="w-full"
                    onClick={handleVerify}
                    disabled={isLoading || otp.join('').length !== 6}
                >
                    {isLoading ? 'Verifying...' : 'Verify Email'}
                </Button>

                <p className="text-center text-sm text-gray-600">
                    Didn't receive the code?{' '}
                    <button
                        onClick={handleResend}
                        disabled={isResending}
                        className="text-blue-600 hover:underline disabled:opacity-50"
                    >
                        {isResending ? 'Sending...' : 'Resend code'}
                    </button>
                </p>
            </CardContent>
        </Card>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    )
}