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

const resetSchema = z.object({
    email: z.string().email('Valid email is required'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
})

type ResetForm = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({
        resolver: zodResolver(resetSchema)
    })

    const onSubmit = async (data: ResetForm) => {
        setIsLoading(true)
        try {
            await api.post('/api/auth/reset-password', {
                email: data.email,
                otp: data.otp,
                newPassword: data.newPassword
            })
            toast.success('Password reset successfully')
            router.push('/login')
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
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
                <CardTitle>Reset password</CardTitle>
                <CardDescription>
                    Enter the OTP from your email and choose a new password
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="hari@example.com"
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="otp">One-time code</Label>
                        <Input
                            id="otp"
                            type="text"
                            placeholder="123456"
                            maxLength={6}
                            {...register('otp')}
                        />
                        {errors.otp && (
                            <p className="text-sm text-red-500">{errors.otp.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New password</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            placeholder="••••••••"
                            {...register('newPassword')}
                        />
                        {errors.newPassword && (
                            <p className="text-sm text-red-500">{errors.newPassword.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm new password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            {...register('confirmPassword')}
                        />
                        {errors.confirmPassword && (
                            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                        )}
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Resetting...' : 'Reset password'}
                    </Button>
                </form>
                <p className="text-center text-sm text-gray-600">
                    <Link href="/login" className="text-blue-600 hover:underline">
                        Back to login
                    </Link>
                </p>
            </CardContent>
        </Card>
    )
}