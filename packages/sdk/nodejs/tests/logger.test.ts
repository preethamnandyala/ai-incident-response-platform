import axios from 'axios'
import { IncidentAI } from '../src/logger'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('IncidentAI SDK', () => {

    let mockPost: jest.Mock
    let monitor: IncidentAI

    beforeEach(() => {
        mockPost = jest.fn().mockResolvedValue({ data: { id: 'log_123' } })
        mockedAxios.create.mockReturnValue({
            post: mockPost
        } as any)

        monitor = new IncidentAI({
            apiKey: 'test-api-key',
            service: 'test-service',
            apiUrl: 'http://localhost:3000'
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should send INFO log with correct payload', async () => {
        await monitor.info('Test message', { userId: '123' })

        expect(mockPost).toHaveBeenCalledWith('/api/logs/ingest', {
            level: 'INFO',
            message: 'Test message',
            service_name: 'test-service',
            metadata: { userId: '123' }
        })
    })

    it('should send WARNING log with correct payload', async () => {
        await monitor.warning('High memory usage', { percent: 85 })

        expect(mockPost).toHaveBeenCalledWith('/api/logs/ingest', {
            level: 'WARNING',
            message: 'High memory usage',
            service_name: 'test-service',
            metadata: { percent: 85 }
        })
    })

    it('should send ERROR log with correct payload', async () => {
        await monitor.error('Database timeout', { duration: 30000 })

        expect(mockPost).toHaveBeenCalledWith('/api/logs/ingest', {
            level: 'ERROR',
            message: 'Database timeout',
            service_name: 'test-service',
            metadata: { duration: 30000 }
        })
    })

    it('should send CRITICAL log with correct payload', async () => {
        await monitor.critical('Database lost')

        expect(mockPost).toHaveBeenCalledWith('/api/logs/ingest', {
            level: 'CRITICAL',
            message: 'Database lost',
            service_name: 'test-service',
            metadata: {}
        })
    })

    it('should send empty metadata when not provided', async () => {
        await monitor.info('Simple message')

        expect(mockPost).toHaveBeenCalledWith('/api/logs/ingest', {
            level: 'INFO',
            message: 'Simple message',
            service_name: 'test-service',
            metadata: {}
        })
    })

    it('should not throw when API call fails in silent mode', async () => {
        mockPost.mockRejectedValue(new Error('Network error'))

        await expect(
            monitor.critical('Database lost')
        ).resolves.not.toThrow()
    })

    it('should throw when API call fails and silent is false', async () => {
        mockPost.mockRejectedValue(new Error('Network error'))

        const noisyMonitor = new IncidentAI({
            apiKey: 'test-key',
            service: 'test-service',
            apiUrl: 'http://localhost:3000',
            silent: false
        })

        await expect(
            noisyMonitor.critical('Database lost')
        ).rejects.toThrow('Network error')
    })

    it('should use service name from config in every log', async () => {
        const customMonitor = new IncidentAI({
            apiKey: 'test-key',
            service: 'payment-service',
            apiUrl: 'http://localhost:3000'
        })

        await customMonitor.error('Payment failed')

        expect(mockPost).toHaveBeenCalledWith('/api/logs/ingest', expect.objectContaining({
            service_name: 'payment-service'
        }))
    })
})