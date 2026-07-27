'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import axios from 'axios'
import {
    LayoutDashboard,
    AlertTriangle,
    FileText,
    LogOut,
    Zap,
    Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/incidents', label: 'Incidents', icon: AlertTriangle },
    { href: '/logs', label: 'Logs', icon: FileText },
    { href: '/settings', label: 'Settings', icon: Settings }
]

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const { isAuthenticated, user, logout, setAccessToken, setUser } = useAuthStore()
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        const tryRefresh = async () => {
            if (isAuthenticated) {
                setChecking(false)
                return
            }

            try {
                // Try to refresh token using httpOnly cookie
                const response = await axios.post(
                    `${API_BASE_URL}/api/auth/refresh`,
                    {},
                    { withCredentials: true }
                )
                const { accessToken } = response.data
                setAccessToken(accessToken)

                // Fetch user info
                const userResponse = await axios.get(
                    `${API_BASE_URL}/api/auth/me`,
                    {
                        headers: { Authorization: `Bearer ${accessToken}` },
                        withCredentials: true
                    }
                )
                setUser(userResponse.data)
            } catch {
                // Refresh failed — redirect to login
                router.push('/login')
            } finally {
                setChecking(false)
            }
        }

        tryRefresh()
    }, [])

    const handleLogout = async () => {
        try {
            await api.post('/api/auth/logout')
        } catch {
            // logout anyway even if API call fails
        } finally {
            logout()
            toast.success('Logged out successfully')
            router.push('/login')
        }
    }

    if (checking) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg">IncidentAI</span>
                    </div>
                </div>
                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-gray-100 text-gray-900'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>
                {/* User info at bottom */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {user?.name || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {user?.email || ''}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </aside>
            {/* Main content */}
            <main className="flex-1 overflow-auto">
                {/* Topbar */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
                    <h1 className="text-lg font-semibold text-gray-900">
                        {navItems.find(item => item.href === pathname)?.label || 'Dashboard'}
                    </h1>
                </header>
                {/* Page content */}
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    )
}