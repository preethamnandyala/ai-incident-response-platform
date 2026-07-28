import { Request, Response } from 'express'
import { AuthController } from '../src/controllers/auth.controller'
import { AuthService } from '../src/services/auth.service'
import { ConflictError, UnauthorizedError, BadRequestError, NotFoundError } from '../src/utils/errors'
import { EmailVerificationService } from '../src/services/email-verification.service'

jest.mock('../src/services/auth.service')
jest.mock('../src/services/email-verification.service')

const mockAuthService = new AuthService(null as any) as jest.Mocked<AuthService>
const mockEmailVerificationService = new EmailVerificationService(null as any) as jest.Mocked<EmailVerificationService>

describe('AuthController', () => {

    let authController: AuthController
    let req: Partial<Request>
    let res: Partial<Response>
    let statusMock: jest.Mock
    let jsonMock: jest.Mock
    let cookieMock: jest.Mock

    beforeEach(() => {
        jest.clearAllMocks()
        authController = new AuthController(mockAuthService, mockEmailVerificationService)

        jsonMock = jest.fn()
        statusMock = jest.fn().mockReturnValue({ json: jsonMock })
        cookieMock = jest.fn()


        req = {
            body: {
                name: 'Hari',
                email: 'hari@example.com',
                password: 'SecurePass1!'
            }
        }

        res = {
            status: statusMock,
            cookie: cookieMock
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
            mockEmailVerificationService.sendVerificationOTP.mockResolvedValue(undefined)
            await authController.signup(req as Request, res as Response)

            expect(mockEmailVerificationService.sendVerificationOTP).toHaveBeenCalledWith('123')
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

    describe('login', () => {

      it('should return 200, set cookie, and return access token on successful login', async () => {
          mockAuthService.login.mockResolvedValue({
              accessToken: 'fake-access-token',
              refreshToken: 'fake-refresh-token',
              user: {
                  id: '123',
                  name: 'Hari',
                  email: 'hari@example.com',
                  role: 'DEVELOPER' as any
              }
          })

          req.body = {
              email: 'hari@example.com',
              password: 'SecurePass1!'
          }

          

          await authController.login(req as Request, res as Response)

          expect(cookieMock).toHaveBeenCalledWith(
            'refreshToken',
            'fake-refresh-token',
            expect.objectContaining({ httpOnly: true, secure: false })
          )
          expect(statusMock).toHaveBeenCalledWith(200)
          expect(jsonMock).toHaveBeenCalledWith(
              expect.objectContaining({ accessToken: 'fake-access-token' })
          )
      })

      it('should return 401 when credentials are invalid', async () => {
          mockAuthService.login.mockRejectedValue(
              new UnauthorizedError('Invalid email or password')
          )

          req.body = {
              email: 'hari@example.com',
              password: 'WrongPassword1!'
          }

          await authController.login(req as Request, res as Response)

          expect(statusMock).toHaveBeenCalledWith(401)
          expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid email or password' })
      })

      it('should return 500 when an unexpected error occurs', async () => {
          mockAuthService.login.mockRejectedValue(
              new Error('Database connection lost')
          )

          req.body = {
              email: 'hari@example.com',
              password: 'SecurePass1!'
          }

          await authController.login(req as Request, res as Response)

          expect(statusMock).toHaveBeenCalledWith(500)
          expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
      })

    })

    describe('logout', () => {

        it('should return 200 and clear cookie on successful logout', async () => {
            mockAuthService.logout.mockResolvedValue(undefined)

            const clearCookieMock = jest.fn()
            res.clearCookie = clearCookieMock

            req.cookies = { refreshToken: 'fake-refresh-token' }

            await authController.logout(req as Request, res as Response)

            expect(mockAuthService.logout).toHaveBeenCalledWith('fake-refresh-token')
            expect(clearCookieMock).toHaveBeenCalledWith(
                'refreshToken',
                expect.objectContaining({ httpOnly: true })
            )
            expect(statusMock).toHaveBeenCalledWith(200)
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Logged out successfully' })
        })

        it('should return 400 when refresh token is missing', async () => {
            mockAuthService.logout.mockRejectedValue(
                new BadRequestError('Refresh token is required')
            )

            req.cookies = {}

            await authController.logout(req as Request, res as Response)

            expect(statusMock).toHaveBeenCalledWith(400)
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Refresh token is required' })
        })

        it('should return 500 when unexpected error occurs', async () => {
            mockAuthService.logout.mockRejectedValue(new Error('Unexpected'))

            req.cookies = { refreshToken: 'fake-refresh-token' }

            await authController.logout(req as Request, res as Response)

            expect(statusMock).toHaveBeenCalledWith(500)
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
        })

    })

    describe('refresh', () => {

        it('should return 200 and new access token on valid refresh token', async () => {
            mockAuthService.refresh.mockResolvedValue({
                accessToken: 'new-fake-access-token'
            })

            req.cookies = { refreshToken: 'fake-refresh-token' }

            await authController.refresh(req as Request, res as Response)

            expect(mockAuthService.refresh).toHaveBeenCalledWith('fake-refresh-token')
            expect(statusMock).toHaveBeenCalledWith(200)
            expect(jsonMock).toHaveBeenCalledWith({ accessToken: 'new-fake-access-token' })
        })

        it('should return 401 when refresh token is invalid', async () => {
            mockAuthService.refresh.mockRejectedValue(
                new UnauthorizedError('Invalid refresh token')
            )

            req.cookies = { refreshToken: 'invalid-token' }

            await authController.refresh(req as Request, res as Response)

            expect(statusMock).toHaveBeenCalledWith(401)
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid refresh token' })
        })

        it('should return 500 when unexpected error occurs', async () => {
            mockAuthService.refresh.mockRejectedValue(new Error('Unexpected'))

            req.cookies = { refreshToken: 'fake-refresh-token' }

            await authController.refresh(req as Request, res as Response)

            expect(statusMock).toHaveBeenCalledWith(500)
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
        })

    })

    describe('me', () => {

        it('should return 200 and user profile', async () => {
            mockAuthService.me.mockResolvedValue({
                id: '123',
                name: 'Hari',
                email: 'hari@example.com',
                role: 'DEVELOPER' as any,
                createdAt: new Date(),
                updatedAt: new Date()
            })

            req = {
                ...req,
                user: { userId: '123', role: 'DEVELOPER' }
            } as any

            await authController.me(req as Request, res as Response)

            expect(mockAuthService.me).toHaveBeenCalledWith('123')
            expect(statusMock).toHaveBeenCalledWith(200)
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({ email: 'hari@example.com' })
            )
        })

        it('should return 404 when user not found', async () => {
            mockAuthService.me.mockRejectedValue(
                new NotFoundError('User not found')
            )

            req = {
                ...req,
                user: { userId: 'nonexistent', role: 'DEVELOPER' }
            } as any

            await authController.me(req as Request, res as Response)

            expect(statusMock).toHaveBeenCalledWith(404)
            expect(jsonMock).toHaveBeenCalledWith({ error: 'User not found' })
        })

        it('should return 500 when unexpected error occurs', async () => {
            mockAuthService.me.mockRejectedValue(new Error('Unexpected'))

            req = {
                ...req,
                user: { userId: '123', role: 'DEVELOPER' }
            } as any

            await authController.me(req as Request, res as Response)

            expect(statusMock).toHaveBeenCalledWith(500)
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
        })

    })

})