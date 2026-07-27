'use client'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

export default function SettingsPage() {
    const { user } = useAuthStore()
    const organizationId = 'org_default'
    const [copied, setCopied] = useState<string | null>(null)

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        setCopied(label)
        toast.success(`${label} copied to clipboard`)
        setTimeout(() => setCopied(null), 2000)
    }

    const codeSnippet = `import { IncidentAI } from '@incidentai/sdk'

const monitor = new IncidentAI({
    apiKey: '${organizationId}',
    service: 'your-service-name',
    apiUrl: 'http://localhost:3000'
})

// Send logs
monitor.info('App started')
monitor.warning('High memory usage', { memoryMb: 512 })
monitor.error('Database query failed', { query: 'SELECT...' })
monitor.critical('Service completely down')`

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Configure your organization and integrations
                </p>
            </div>

            {/* Organization */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-sm font-medium text-gray-900 mb-4">Organization</h2>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Organization ID</p>
                            <p className="text-sm font-mono font-medium text-gray-900 mt-0.5">
                                {organizationId}
                            </p>
                        </div>
                        <button
                            onClick={() => copyToClipboard(organizationId, 'Organization ID')}
                            className="text-xs text-blue-600 hover:underline"
                        >
                            {copied === 'Organization ID' ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                    {user && (
                        <div className="pt-3 border-t border-gray-100">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Name</span>
                                <span className="font-medium">{user.name}</span>
                            </div>
                            <div className="flex justify-between text-sm mt-2">
                                <span className="text-gray-500">Email</span>
                                <span className="font-medium">{user.email}</span>
                            </div>
                            <div className="flex justify-between text-sm mt-2">
                                <span className="text-gray-500">Role</span>
                                <span className="font-medium">{user.role}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Setup */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-medium text-gray-900">Quick Setup</h2>
                    <button
                        onClick={() => copyToClipboard(codeSnippet, 'Code snippet')}
                        className="text-xs text-blue-600 hover:underline"
                    >
                        {copied === 'Code snippet' ? 'Copied!' : 'Copy code'}
                    </button>
                </div>

                <p className="text-sm text-gray-500 mb-3">
                    Install the SDK and add this to your application:
                </p>

                <div className="bg-gray-50 rounded-lg p-2 mb-3">
                    <code className="text-xs text-gray-700">
                        npm install @incidentai/sdk
                    </code>
                </div>

                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto">
                    <code>{codeSnippet}</code>
                </pre>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-sm font-medium text-gray-900 mb-4">Notifications</h2>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Alert email</span>
                        <span className="font-medium">Configured via environment</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Slack</span>
                        <span className="font-medium">Configured via environment</span>
                    </div>
                    <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                        Notification settings are configured in the server environment.
                        Per-service routing coming in a future update.
                    </p>
                </div>
            </div>
        </div>
    )
}