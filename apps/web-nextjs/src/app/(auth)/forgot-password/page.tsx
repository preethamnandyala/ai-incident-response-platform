'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/utils'

const forgotSchema = z.object({
    email: z.string().min(1, 'Email is required').refine(
        (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        'Please enter a valid email address'
    )
})

type ForgotForm = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [email, setEmail] = useState('')

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
        resolver: zodResolver(forgotSchema)
    })

    const onSubmit = async (data: ForgotForm) => {
        setIsLoading(true)
        try {
            await api.post('/api/auth/forgot-password', data)
            setEmail(data.email)
            setSubmitted(true)
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    if (submitted) {
        return (
            <Card>
                <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                            </svg>
                        </div>
                        <span className="font-bold text-xl">IncidentAI</span>
                    </div>
                    <CardTitle>Check your email</CardTitle>
                    <CardDescription>
                        We sent a 6-digit code to{' '}
                        <span className="font-medium text-gray-900">{email}</span>.
                        The code expires in 15 minutes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        className="w-full"
                        onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
                    >
                        Enter OTP
                    </Button>
                    <p className="text-center text-sm text-gray-600">
                        <Link href="/login" className="text-blue-600 hover:underline">
                            Back to login
                        </Link>
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                    </div>
                    <span className="font-bold text-xl">IncidentAI</span>
                </div>
                <CardTitle>Forgot password?</CardTitle>
                <CardDescription>
                    Enter your email and we will send you a one-time code
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="text"
                            placeholder="hari@example.com"
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send OTP'}
                    </Button>
                </form>
                <p className="text-center text-sm text-gray-600">
                    Remember your password?{' '}
                    <Link href="/login" className="text-blue-600 hover:underline">
                        Sign in
                    </Link>
                </p>
            </CardContent>
        </Card>
    )
}