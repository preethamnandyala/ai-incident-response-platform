'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIncidents } from '@/hooks/useIncidents'
import { Incident } from '@/types'

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

export default function IncidentsPage() {
    const router = useRouter()
    const { incidents, loading, error } = useIncidents()
    const [filterSeverity, setFilterSeverity] = useState('')
    const [filterStatus, setFilterStatus] = useState('')

    const filtered = incidents.filter(incident => {
        if (filterSeverity && incident.severity !== filterSeverity) return false
        if (filterStatus && incident.status !== filterStatus) return false
        return true
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {filtered.length} incident{filtered.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                <select
                    value={filterSeverity}
                    onChange={e => setFilterSeverity(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                >
                    <option value="">All severities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                >
                    <option value="">All statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="INVESTIGATING">Investigating</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                </select>
            </div>

            {/* Incidents list */}
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                {filtered.length === 0 ? (
                    <div className="p-6">
                        <p className="text-sm text-gray-500">
                            No incidents found.
                        </p>
                    </div>
                ) : (
                    filtered.map(incident => (
                        <div
                            key={incident.id}
                            onClick={() => router.push(`/incidents/${incident.id}`)}
                            className="p-4 hover:bg-gray-50 cursor-pointer"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">
                                        {incident.title}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {incident.serviceName} · Created by {incident.createdBy} · {new Date(incident.createdAt).toLocaleString()}
                                    </p>
                                    {incident.description && (
                                        <p className="text-xs text-gray-400 mt-1 truncate">
                                            {incident.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityColor(incident.severity)}`}>
                                        {incident.severity}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(incident.status)}`}>
                                        {incident.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}