'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { getErrorMessage, cn } from '@/lib/utils'

const loginSchema = z.object({
    email: z.string().min(1, 'Email is required').refine(
        (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        'Please enter a valid email address'
    ),
    password: z.string().min(1, 'Password is required')
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
    const router = useRouter()
    const { setAccessToken, setUser } = useAuthStore()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields }
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        mode: 'all'
    })

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true)
        setServerError(null)
        try {
            const response = await api.post('/api/auth/login', data)
            setAccessToken(response.data.accessToken)
            setUser(response.data.user)
            toast.success('Logged in successfully')
            router.push('/dashboard')
        } catch (error) {
            setServerError('Invalid email or password')
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = () => {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`
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
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>
                    Sign in to your account to continue
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    {/* Server error message */}
                    {serverError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <p className="text-sm text-red-600">{serverError}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="text"
                            placeholder="hari@example.com"
                            className={cn(
                                serverError && 'border-red-500 focus-visible:ring-red-500',
                                !serverError && touchedFields.email && errors.email && 'border-red-500 focus-visible:ring-red-500',
                                !serverError && touchedFields.email && !errors.email && 'border-green-500 focus-visible:ring-green-500'
                            )}
                            
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className={cn(
                                    'pr-10',
                                    serverError && 'border-red-500 focus-visible:ring-red-500',
                                    !serverError && touchedFields.password && errors.password && 'border-red-500 focus-visible:ring-red-500',
                                    !serverError && touchedFields.password && !errors.password && 'border-green-500 focus-visible:ring-green-500'
                                )}
                                
                                {...register('password')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword
                                    ? <EyeOff className="w-4 h-4" />
                                    : <Eye className="w-4 h-4" />
                                }
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <Link
                            href="/forgot-password"
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign in'}
                    </Button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                </div>

                <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleLogin}
                >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                </Button>

                <p className="text-center text-sm text-gray-600">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="text-blue-600 hover:underline">
                        Sign up
                    </Link>
                </p>
            </CardContent>
        </Card>
    )
}