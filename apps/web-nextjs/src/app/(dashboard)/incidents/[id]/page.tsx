'use client'
import { use } from 'react'
import { useIncident } from '@/hooks/useIncidents'
import { useAIAnalysis } from '@/hooks/useAIAnalysis'
import { useRouter } from 'next/navigation'

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

function getActionLabel(action: string) {
    switch (action) {
        case 'INCIDENT_CREATED': return 'Incident created'
        case 'STATUS_CHANGED': return 'Status changed'
        case 'INCIDENT_ASSIGNED': return 'Incident assigned'
        default: return action
    }
}

export default function IncidentDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params)
    const router = useRouter()
    const { incident, timeline, loading, error, updateStatus } = useIncident(id)
    const { analysis, loading: aiLoading, triggering, triggerAnalysis } = useAIAnalysis(id)

    const handleStatusChange = async (newStatus: string) => {
        try {
            await updateStatus(newStatus)
        } catch (err) {
            console.error('Failed to update status:', err)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (error || !incident) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error || 'Incident not found'}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <button
                        onClick={() => router.push('/incidents')}
                        className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
                    >
                        ← Back to incidents
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">
                        {incident.title}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {incident.serviceName} · {new Date(incident.createdAt).toLocaleString()}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(incident.status)}`}>
                        {incident.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-sm font-medium text-gray-900 mb-4">Details</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Service</span>
                                <span className="font-medium">{incident.serviceName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Created by</span>
                                <span className="font-medium">{incident.createdBy}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Assigned to</span>
                                <span className="font-medium">
                                    {incident.assignedTo || 'Unassigned'}
                                </span>
                            </div>
                            {incident.description && (
                                <div className="pt-2 border-t border-gray-100">
                                    <p className="text-sm text-gray-600">
                                        {incident.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-medium text-gray-900">
                                AI Analysis
                            </h2>
                            {!analysis && !aiLoading && (
                                <button
                                    onClick={triggerAnalysis}
                                    disabled={triggering}
                                    className="text-xs bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-50"
                                >
                                    {triggering ? 'Analyzing...' : 'Analyze with AI'}
                                </button>
                            )}
                        </div>

                        {aiLoading ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                                Loading analysis...
                            </div>
                        ) : analysis ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-900">
                                        Root Cause
                                    </p>
                                    <span className="text-xs text-gray-500">
                                        {Math.round(analysis.confidence * 100)}% confidence
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                                    {analysis.rootCause}
                                </p>

                                {(analysis.possibleCauses || []).length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 mb-2">
                                            Possible Causes
                                        </p>
                                        <ul className="space-y-1">
                                            {(analysis.possibleCauses || []).map((cause, i) => (
                                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                                    <span className="text-gray-400 mt-0.5">•</span>
                                                    {cause}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {(analysis.suggestedActions || []).length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 mb-2">
                                            Suggested Actions
                                        </p>
                                        <ol className="space-y-1">
                                            {(analysis.suggestedActions || []).map((action, i) => (
                                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                                    <span className="text-gray-400 text-xs mt-0.5 font-mono">
                                                        {i + 1}.
                                                    </span>
                                                    {action}
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}

                                <p className="text-xs text-gray-400">
                                    Analyzed by {analysis.modelUsed}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                No analysis yet. Click "Analyze with AI" to generate root cause analysis.
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-sm font-medium text-gray-900 mb-4">
                            Update Status
                        </h2>
                        <div className="space-y-2">
                            {['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusChange(status)}
                                    disabled={incident.status === status}
                                    className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                                        incident.status === status
                                            ? 'border-black bg-black text-white'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-sm font-medium text-gray-900 mb-4">
                            Timeline
                        </h2>
                        {timeline.length === 0 ? (
                            <p className="text-sm text-gray-500">No timeline entries</p>
                        ) : (
                            <div className="space-y-3">
                                {timeline.map((entry, i) => (
                                    <div key={entry.id} className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-1.5" />
                                            {i < timeline.length - 1 && (
                                                <div className="w-0.5 bg-gray-200 flex-1 mt-1" />
                                            )}
                                        </div>
                                        <div className="pb-3">
                                            <p className="text-sm font-medium text-gray-900">
                                                {getActionLabel(entry.action)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {entry.performedBy} · {new Date(entry.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}