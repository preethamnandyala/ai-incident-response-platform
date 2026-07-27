'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Incident } from '@/types'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

function getSeverityColor(severity: string) {
    switch (severity) {
        case 'CRITICAL': return 'bg-red-100 text-red-800'
        case 'HIGH': return 'bg-orange-100 text-orange-800'
        case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
        case 'LOW': return 'bg-green-100 text-green-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}

function getStatusColor(status: string) {
    switch (status) {
        case 'OPEN': return 'bg-red-100 text-red-800'
        case 'INVESTIGATING': return 'bg-yellow-100 text-yellow-800'
        case 'RESOLVED': return 'bg-green-100 text-green-800'
        case 'CLOSED': return 'bg-gray-100 text-gray-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}

export default function DashboardPage() {
    const router = useRouter()
    const { isAuthenticated } = useAuthStore()
    const [incidents, setIncidents] = useState<Incident[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isAuthenticated) return
        api.get('/api/incidents')
            .then(res => setIncidents(res.data))
            .catch(() => setIncidents([]))
            .finally(() => setLoading(false))
    }, [isAuthenticated])

    const activeIncidents = incidents.filter(
        i => i.status === 'OPEN' || i.status === 'INVESTIGATING'
    )
    const criticalIncidents = incidents.filter(
        i => i.severity === 'CRITICAL'
    )
    const resolvedIncidents = incidents.filter(
        i => i.status === 'RESOLVED' || i.status === 'CLOSED'
    )
    const recentIncidents = [...incidents]
        .sort((a, b) => new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime())
        .slice(0, 5)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Overview of your platform health
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <p className="text-sm text-gray-500">Active Incidents</p>
                    <p className="text-3xl font-bold mt-1 text-red-600">
                        {activeIncidents.length}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Requires attention</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <p className="text-sm text-gray-500">Critical Incidents</p>
                    <p className="text-3xl font-bold mt-1 text-orange-600">
                        {criticalIncidents.length}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Highest severity</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <p className="text-sm text-gray-500">Resolved</p>
                    <p className="text-3xl font-bold mt-1 text-green-600">
                        {resolvedIncidents.length}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Successfully closed</p>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">Recent Incidents</p>
                    <button
                        onClick={() => router.push('/incidents')}
                        className="text-xs text-blue-600 hover:underline"
                    >
                        View all →
                    </button>
                </div>
                {recentIncidents.length === 0 ? (
                    <div className="p-6">
                        <p className="text-sm text-gray-500">
                            No incidents yet. Send a CRITICAL log to create one.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {recentIncidents.map(incident => (
                            <div
                                key={incident.id}
                                onClick={() => router.push(`/incidents/${incident.id}`)}
                                className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {incident.title}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {incident.serviceName} · {new Date(incident.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityColor(incident.severity)}`}>
                                        {incident.severity}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(incident.status)}`}>
                                        {incident.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}