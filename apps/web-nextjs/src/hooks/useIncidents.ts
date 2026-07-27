import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Incident, IncidentTimeline } from '@/types'
import { useAuthStore } from '@/store/auth.store'

export function useIncidents() {
    const [incidents, setIncidents] = useState<Incident[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { isAuthenticated } = useAuthStore()

    const fetchIncidents = async () => {
        try {
            setLoading(true)
            const response = await api.get('/api/incidents')
            setIncidents(response.data)
            setError(null)
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch incidents')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isAuthenticated) {
            fetchIncidents()
        }
    }, [isAuthenticated])

    return { incidents, loading, error, refetch: fetchIncidents }
}

export function useIncident(id: string) {
    const [incident, setIncident] = useState<Incident | null>(null)
    const [timeline, setTimeline] = useState<IncidentTimeline[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { isAuthenticated } = useAuthStore()

    useEffect(() => {
        if (!id || !isAuthenticated) return

        const fetchIncident = async () => {
            try {
                setLoading(true)
                const [incidentRes, timelineRes] = await Promise.all([
                    api.get(`/api/incidents/${id}`),
                    api.get(`/api/incidents/${id}/timeline`)
                ])
                setIncident(incidentRes.data)
                setTimeline(timelineRes.data)
                setError(null)
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to fetch incident')
            } finally {
                setLoading(false)
            }
        }

        fetchIncident()
    }, [id, isAuthenticated])

    const updateStatus = async (status: string) => {
        try {
            const response = await api.patch(
                `/api/incidents/${id}/status`,
                { status }
            )
            setIncident(response.data)
            const timelineRes = await api.get(`/api/incidents/${id}/timeline`)
            setTimeline(timelineRes.data)
        } catch (err: any) {
            throw new Error(err.response?.data?.error || 'Failed to update status')
        }
    }

    return { incident, timeline, loading, error, updateStatus }
}