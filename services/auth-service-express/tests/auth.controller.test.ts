import { Request, Response } from 'express'
import { AuthController } from '../src/controllers/auth.controller'
import { AuthService } from '../src/services/auth.service'
import { ConflictError, UnauthorizedError } from '../src/utils/errors'

jest.mock('../src/services/auth.service')

const mockAuthService = new AuthService(null as any) as jest.Mocked<AuthService>

describe('AuthController', () => {

    let authController: AuthController
    let req: Partial<Request>
    let res: Partial<Response>
    let statusMock: jest.Mock
    let jsonMock: jest.Mock
    let cookieMock: jest.Mock

    beforeEach(() => {
        jest.clearAllMocks()
        authController = new AuthController(mockAuthService)

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
            expect.objectContaining({ httpOnly: true, secure: true })
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

})