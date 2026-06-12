import { Request, Response } from 'express'
import { AuthController } from '../src/controllers/auth.controller'
import { AuthService } from '../src/services/auth.service'
import { ConflictError } from '../src/utils/errors'

jest.mock('../src/services/auth.service')

const mockAuthService = new AuthService(null as any) as jest.Mocked<AuthService>

describe('AuthController', () => {

    let authController: AuthController
    let req: Partial<Request>
    let res: Partial<Response>
    let statusMock: jest.Mock
    let jsonMock: jest.Mock

    beforeEach(() => {
        jest.clearAllMocks()
        authController = new AuthController(mockAuthService)

        jsonMock = jest.fn()
        statusMock = jest.fn().mockReturnValue({ json: jsonMock })

        req = {
            body: {
                name: 'Hari',
                email: 'hari@example.com',
                password: 'SecurePass1!'
            }
        }

        res = {
            status: statusMock
        }
    })

    describe('signup', () => {

        it('should return 201 and user data on successful signup', async () => {
            mockAuthService.signup.mockResolvedValue({
                id: '123',
                name: 'Hari',
                email: 'hari@example.com',
                role: 'DEVELOPER' as any,
                createdAt: new Date(),
                updatedAt: new Date()
            })

            await authController.signup(req as Request, res as Response)

            expect(statusMock).toHaveBeenCalledWith(201)
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({ email: 'hari@example.com' })
            )
        })

        it('should return 409 when email already exists', async () => {
            mockAuthService.signup.mockRejectedValue(
                new ConflictError('Email already exists')
            )

            await authController.signup(req as Request, res as Response)

            expect(statusMock).toHaveBeenCalledWith(409)
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Email already exists' })
        })

        it('should return 500 when an unexpected error occurs', async () => {
            mockAuthService.signup.mockRejectedValue(
                new Error('Database connection lost')
            )

            await authController.signup(req as Request, res as Response)

            expect(statusMock).toHaveBeenCalledWith(500)
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
        })

    })

})