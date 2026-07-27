import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { PaginatedLogs } from '@/types'
import { useAuthStore } from '@/store/auth.store'

interface LogFilters {
    level?: string
    service_name?: string
    page?: number
    limit?: number
}

export function useLogs(filters: LogFilters = {}) {
    const [data, setData] = useState<PaginatedLogs>({
        logs: [],
        total: 0,
        page: 1,
        limit: 50,
        pages: 0
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { isAuthenticated } = useAuthStore()

    const fetchLogs = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (filters.level) params.set('level', filters.level)
            if (filters.service_name) params.set('service_name', filters.service_name)
            if (filters.page) params.set('page', filters.page.toString())
            if (filters.limit) params.set('limit', filters.limit.toString())

            const response = await api.get(`/api/logs?${params.toString()}`)
            setData(response.data)
            setError(null)
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch logs')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isAuthenticated) {
            fetchLogs()
        }
    }, [isAuthenticated, filters.level, filters.service_name, filters.page])

    return { ...data, loading, error, refetch: fetchLogs }
}

export function useServices() {
    const [services, setServices] = useState<string[]>([])
    const { isAuthenticated } = useAuthStore()

    useEffect(() => {
        if (!isAuthenticated) return
        api.get('/api/logs/services/')
            .then(res => setServices(res.data.services || []))
            .catch(() => setServices([]))
    }, [isAuthenticated])

    return services
}