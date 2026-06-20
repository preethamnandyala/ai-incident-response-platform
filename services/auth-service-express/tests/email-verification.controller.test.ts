import { Request, Response } from 'express'
import { EmailVerificationController } from '../src/controllers/email-verification.controller'
import { EmailVerificationService } from '../src/services/email-verification.service'
import { UnauthorizedError, NotFoundError } from '../src/utils/errors'

jest.mock('../src/services/email-verification.service')

const mockEmailVerificationService = new EmailVerificationService(null as any) as jest.Mocked<EmailVerificationService>

describe('EmailVerificationController', () => {

    let controller: EmailVerificationController
    let req: Partial<Request>
    let res: Partial<Response>
    let statusMock: jest.Mock
    let jsonMock: jest.Mock

    beforeEach(() => {
        jest.clearAllMocks()
        controller = new EmailVerificationController(mockEmailVerificationService)

        jsonMock = jest.fn()
        statusMock = jest.fn().mockReturnValue({ json: jsonMock })

        req = {
            body: {},
            user: { userId: '123', role: 'DEVELOPER' }
        } as any

        res = { status: statusMock }
    })

    describe('verifyEmail', () => {

        it('should return 200 on successful verification', async () => {
            mockEmailVerificationService.verifyEmail.mockResolvedValue(undefined)

            req.body = { otp: '123456' }

            await controller.verifyEmail(req as Request, res as Response)

            expect(mockEmailVerificationService.verifyEmail).toHaveBeenCalledWith('123', '123456')
            expect(statusMock).toHaveBeenCalledWith(200)
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Email verified successfully' })
        })

        it('should return 401 when OTP is invalid', async () => {
            mockEmailVerificationService.verifyEmail.mockRejectedValue(
                new UnauthorizedError('Invalid or expired OTP')
            )

            req.body = { otp: '000000' }

            await controller.verifyEmail(req as Request, res as Response)

            expect(statusMock).toHaveBeenCalledWith(401)
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid or expired OTP' })
        })

        it('should return 500 on unexpected error', async () => {
            mockEmailVerificationService.verifyEmail.mockRejectedValue(new Error('DB connection lost'))

            req.body = { otp: '123456' }

            await controller.verifyEmail(req as Request, res as Response)

            expect(statusMock).toHaveBeenCalledWith(500)
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
        })

    })

    describe('resendVerificationOTP', () => {

        it('should return 200 on successful resend', async () => {
            mockEmailVerificationService.sendVerificationOTP.mockResolvedValue(undefined)

            await controller.resendVerificationOTP(req as Request, res as Response)

            expect(mockEmailVerificationService.sendVerificationOTP).toHaveBeenCalledWith('123')
            expect(statusMock).toHaveBeenCalledWith(200)
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Verification OTP sent' })
        })

        it('should return 404 when user not found', async () => {
            mockEmailVerificationService.sendVerificationOTP.mockRejectedValue(
                new NotFoundError('User not found')
            )

            await controller.resendVerificationOTP(req as Request, res as Response)

            expect(statusMock).toHaveBeenCalledWith(404)
            expect(jsonMock).toHaveBeenCalledWith({ error: 'User not found' })
        })

        it('should return 500 on unexpected error', async () => {
            mockEmailVerificationService.sendVerificationOTP.mockRejectedValue(new Error('DB connection lost'))

            await controller.resendVerificationOTP(req as Request, res as Response)

            expect(statusMock).toHaveBeenCalledWith(500)
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
        })

    })

})