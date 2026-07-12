export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <p className="text-sm text-gray-500">Active Incidents</p>
                    <p className="text-3xl font-bold mt-1">—</p>
                    <p className="text-xs text-gray-400 mt-1">Available after Phase 4</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <p className="text-sm text-gray-500">Logs Today</p>
                    <p className="text-3xl font-bold mt-1">—</p>
                    <p className="text-xs text-gray-400 mt-1">Available after Phase 5</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <p className="text-sm text-gray-500">AI Analyses</p>
                    <p className="text-3xl font-bold mt-1">—</p>
                    <p className="text-xs text-gray-400 mt-1">Available after Phase 8</p>
                </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-sm font-medium text-gray-900 mb-2">Recent Incidents</p>
                <p className="text-sm text-gray-500">No incidents yet. Available after Phase 4.</p>
            </div>
        </div>
    )
}