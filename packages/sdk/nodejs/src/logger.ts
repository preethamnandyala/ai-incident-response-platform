import axios, { AxiosInstance } from 'axios'
import {
    IncidentAIConfig,
    LogLevel,
    LogPayload,
    LogResponse
} from './types'

export class IncidentAI {
    private readonly client: AxiosInstance
    private readonly config: IncidentAIConfig

    constructor(config: IncidentAIConfig) {
        this.config = {
            timeout: 5000,
            silent: true,
            ...config
        }

        this.client = axios.create({
            baseURL: config.apiUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': config.apiKey,
                'X-Organization-Id': config.apiKey,
            }
        })
    }

    async info(
        message: string,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.log('INFO', message, metadata)
    }

    async warning(
        message: string,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.log('WARNING', message, metadata)
    }

    async error(
        message: string,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.log('ERROR', message, metadata)
    }

    async critical(
        message: string,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.log('CRITICAL', message, metadata)
    }

    private async log(
        level: LogLevel,
        message: string,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        const payload: LogPayload = {
            level,
            message,
            service_name: this.config.service,
            metadata: metadata || {}
        }

        try {
            await this.client.post<LogResponse>('/api/logs/ingest', payload)
        } catch (error) {
            if (!this.config.silent) {
                throw error
            }
            // silent mode — never crash the application
            // monitoring should never take down the service it monitors
        }
    }
}