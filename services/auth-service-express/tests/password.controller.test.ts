import { Request, Response } from 'express'
import { PasswordController } from '../src/controllers/password.controller'
import { PasswordService } from '../src/services/password.service'
import { UnauthorizedError } from '../src/utils/errors'

jest.mock('../src/services/password.service')

const mockPasswordService = new PasswordService(null as any) as jest.Mocked<PasswordService>

describe('PasswordController', () => {

    let passwordController: PasswordController
    let req: Partial<Request>
    let res: Partial<Response>
    let statusMock: jest.Mock
    let jsonMock: jest.Mock

    beforeEach(() => {
        jest.clearAllMocks()
        passwordController = new PasswordController(mockPasswordService)

        jsonMock = jest.fn()
        statusMock = jest.fn().mockReturnValue({ json: jsonMock })

        req = { body: {} }
        res = { status: statusMock }
    })

    describe('forgotPassword', () => {

        it('should return 200 with generic message on success', async () => {
            mockPasswordService.forgotPassword.mockResolvedValue(undefined)

            req.body = { email: 'hari@example.com' }

            await passwordController.forgotPassword(req as Request, res as Response)

            expect(mockPasswordService.forgotPassword).toHaveBeenCalledWith('hari@example.com')
            expect(statusMock).toHaveBeenCalledWith(200)
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'If an account exists with this email, an OTP has been sent'
            })
        })

        it('should return 500 on unexpected error', async () => {
            mockPasswordService.forgotPassword.mockRejectedValue(new Error('DB connection lost'))

            req.body = { email: 'hari@example.com' }

            await passwordController.forgotPassword(req as Request, res as Response)

            expect(statusMock).toHaveBeenCalledWith(500)
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
        })

    })

    describe('resetPassword', () => {

        it('should return 200 on successful reset', async () => {
            mockPasswordService.resetPassword.mockResolvedValue(undefined)

            req.body = { email: 'hari@example.com', otp: '123456', newPassword: 'NewSecurePass1!' }

            await passwordController.resetPassword(req as Request, res as Response)

            expect(mockPasswordService.resetPassword).toHaveBeenCalledWith(
                'hari@example.com', '123456', 'NewSecurePass1!'
            )
            expect(statusMock).toHaveBeenCalledWith(200)
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Password reset successfully' })
        })

        it('should return 401 when OTP is invalid', async () => {
            mockPasswordService.resetPassword.mockRejectedValue(
                new UnauthorizedError('Invalid or expired OTP')
            )

            req.body = { email: 'hari@example.com', otp: '000000', newPassword: 'NewSecurePass1!' }

            await passwordController.resetPassword(req as Request, res as Response)

            expect(statusMock).toHaveBeenCalledWith(401)
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid or expired OTP' })
        })

    })

    describe('changePassword', () => {

        it('should return 200 on successful change', async () => {
            mockPasswordService.changePassword.mockResolvedValue(undefined)

            req = {
                ...req,
                user: { userId: '123', role: 'DEVELOPER' }
            } as any
            req.body = { oldPassword: 'OldSecurePass1!', newPassword: 'NewSecurePass1!' }

            await passwordController.changePassword(req as Request, res as Response)

            expect(mockPasswordService.changePassword).toHaveBeenCalledWith(
                '123', 'OldSecurePass1!', 'NewSecurePass1!'
            )
            expect(statusMock).toHaveBeenCalledWith(200)
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Password changed successfully' })
        })

        it('should return 401 when old password is incorrect', async () => {
            mockPasswordService.changePassword.mockRejectedValue(
                new UnauthorizedError('Current password is incorrect')
            )

            req = {
                ...req,
                user: { userId: '123', role: 'DEVELOPER' }
            } as any
            req.body = { oldPassword: 'WrongPassword1!', newPassword: 'NewSecurePass1!' }

            await passwordController.changePassword(req as Request, res as Response)

            expect(statusMock).toHaveBeenCalledWith(401)
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Current password is incorrect' })
        })

        it('should return correct status when an AppError occurs', async () => {
            mockPasswordService.forgotPassword.mockRejectedValue(
                new UnauthorizedError('Some auth-related error')
            )

            req.body = { email: 'hari@example.com' }

            await passwordController.forgotPassword(req as Request, res as Response)

            expect(statusMock).toHaveBeenCalledWith(401)
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Some auth-related error' })
        })

        it('should return 500 on unexpected error', async () => {
            mockPasswordService.resetPassword.mockRejectedValue(new Error('DB connection lost'))

            req.body = { email: 'hari@example.com', otp: '123456', newPassword: 'NewSecurePass1!' }

            await passwordController.resetPassword(req as Request, res as Response)

            expect(statusMock).toHaveBeenCalledWith(500)
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
        })

        it('should return 500 on unexpected error', async () => {
            mockPasswordService.changePassword.mockRejectedValue(new Error('DB connection lost'))

            req = {
                ...req,
                user: { userId: '123', role: 'DEVELOPER' }
            } as any
            req.body = { oldPassword: 'OldSecurePass1!', newPassword: 'NewSecurePass1!' }

            await passwordController.changePassword(req as Request, res as Response)

            expect(statusMock).toHaveBeenCalledWith(500)
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
        })

    })

})