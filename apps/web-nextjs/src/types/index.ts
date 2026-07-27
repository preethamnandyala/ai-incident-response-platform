export interface User {
    id: string
    name: string
    email: string
    role: 'ADMIN' | 'DEVELOPER' | 'VIEWER'
}

export interface AuthResponse {
    accessToken: string
    user: User
}

export interface ApiError {
    error: string
    details?: Array<{
        field: string
        message: string
    }>
}

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED'
export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

export interface Incident {
    id: string
    title: string
    description: string
    severity: Severity
    status: IncidentStatus
    serviceName: string
    assignedTo: string | null
    createdBy: string
    organizationId: string
    createdAt: string
    updatedAt: string
}

export interface IncidentTimeline {
    id: string
    incidentId: string
    action: string
    performedBy: string
    details: string
    organizationId: string
    createdAt: string
}

export interface AIAnalysis {
    id: string
    incidentId: string
    rootCause: string
    confidence: number
    possibleCauses: string[]
    suggestedActions: string[]
    similarIncidents: string[]
    modelUsed: string
    createdAt: string
}

export interface Log {
    id: string
    level: LogLevel
    message: string
    service_name: string
    metadata: Record<string, unknown>
    organization_id: string
    timestamp: string
    created_at: string
}

export interface PaginatedLogs {
    logs: Log[]
    total: number
    page: number
    limit: number
    pages: number
}

export interface DashboardStats {
    activeIncidents: number
    totalLogsToday: number
    totalAIAnalyses: number
    criticalIncidents: number
}