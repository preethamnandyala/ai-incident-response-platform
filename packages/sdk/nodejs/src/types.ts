export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

export interface IncidentAIConfig {
    apiKey: string
    service: string
    apiUrl: string
    timeout?: number        // ms before giving up on HTTP call, default 5000
    silent?: boolean        // if true, never throw errors, default true
}

export interface LogPayload {
    level: LogLevel
    message: string
    service_name: string
    metadata?: Record<string, unknown>
    trace_id?: string
    request_id?: string
}

export interface LogResponse {
    id: string
    level: LogLevel
    message: string
    service_name: string
    organization_id: string
    timestamp: string
}