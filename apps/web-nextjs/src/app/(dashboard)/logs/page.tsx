'use client'
import { useState } from 'react'
import { useLogs, useServices } from '@/hooks/useLogs'

function getLevelColor(level: string) {
    switch (level) {
        case 'CRITICAL': return 'bg-red-100 text-red-800'
        case 'ERROR': return 'bg-orange-100 text-orange-800'
        case 'WARNING': return 'bg-yellow-100 text-yellow-800'
        case 'INFO': return 'bg-blue-100 text-blue-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}

export default function LogsPage() {
    const [filterLevel, setFilterLevel] = useState('')
    const [filterService, setFilterService] = useState('')
    const [page, setPage] = useState(1)

    const { logs, total, pages, loading, error } = useLogs({
        level: filterLevel || undefined,
        service_name: filterService || undefined,
        page,
        limit: 50
    })

    const services = useServices()

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
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Logs</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {total} total logs
                </p>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                <select
                    value={filterLevel}
                    onChange={e => {
                        setFilterLevel(e.target.value)
                        setPage(1)
                    }}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                >
                    <option value="">All levels</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="ERROR">Error</option>
                    <option value="WARNING">Warning</option>
                    <option value="INFO">Info</option>
                </select>

                <select
                    value={filterService}
                    onChange={e => {
                        setFilterService(e.target.value)
                        setPage(1)
                    }}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                >
                    <option value="">All services</option>
                    {services.map(service => (
                        <option key={service} value={service}>
                            {service}
                        </option>
                    ))}
                </select>
            </div>

            {/* Logs table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Level</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Service</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Message</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                                    No logs found
                                </td>
                            </tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getLevelColor(log.level)}`}>
                                            {log.level}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                                        {log.service_name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 max-w-md truncate">
                                        {log.message}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Page {page} of {pages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50 hover:border-gray-300"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(pages, p + 1))}
                            disabled={page === pages}
                            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50 hover:border-gray-300"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}