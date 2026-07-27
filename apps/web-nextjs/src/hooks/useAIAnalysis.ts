import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { AIAnalysis } from '@/types'

export function useAIAnalysis(incidentId: string) {
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
    const [loading, setLoading] = useState(true)
    const [triggering, setTriggering] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!incidentId) return

        const fetchAnalysis = async () => {
            try {
                setLoading(true)
                const response = await api.get(
                    `/api/ai/analyses/${incidentId}`
                )
                setAnalysis(response.data)
                setError(null)
            } catch (err: any) {
                if (err.response?.status === 404) {
                    setAnalysis(null)
                    setError(null)
                } else {
                    setError('Failed to fetch AI analysis')
                }
            } finally {
                setLoading(false)
            }
        }

        fetchAnalysis()
    }, [incidentId])

    const triggerAnalysis = async () => {
        try {
            setTriggering(true)
            const response = await api.post(
                `/api/ai/analyses/${incidentId}/trigger`
            )
            setAnalysis(response.data)
            setError(null)
        } catch (err: any) {
            setError('Failed to trigger AI analysis')
        } finally {
            setTriggering(false)
        }
    }

    return { analysis, loading, triggering, error, triggerAnalysis }
}