import { Request, Response } from 'express'
import { OAuthController } from '../src/controllers/oauth.controller'
import { mockGoogleUser } from './fixtures'

describe('OAuthController', () => {

    let controller: OAuthController
    let req: Partial<Request>
    let res: Partial<Response>
    let redirectMock: jest.Mock
    let cookieMock: jest.Mock

    beforeEach(() => {
        jest.clearAllMocks()
        controller = new OAuthController()

        redirectMock = jest.fn()
        cookieMock = jest.fn()

        res = {
            cookie: cookieMock,
            redirect: redirectMock
        }
    })

    describe('googleCallback', () => {

        it('should set refresh token cookie and redirect with access token', async () => {
            req = {
                user: {
                    accessToken: 'fake-access-token',
                    refreshToken: 'fake-refresh-token',
                    user: {
                        id: mockGoogleUser.id,
                        name: mockGoogleUser.name,
                        email: mockGoogleUser.email,
                        role: mockGoogleUser.role as any
                    }
                } as any
            }

            await controller.googleCallback(req as Request, res as Response)

            expect(cookieMock).toHaveBeenCalledWith(
                'refreshToken',
                'fake-refresh-token',
                expect.objectContaining({ httpOnly: true })
            )
            expect(redirectMock).toHaveBeenCalledWith(
                expect.stringContaining('accessToken=fake-access-token')
            )
        })

        it('should redirect to error page when req.user is missing', async () => {
            req = { user: undefined }

            await controller.googleCallback(req as Request, res as Response)

            expect(redirectMock).toHaveBeenCalledWith(
                expect.stringContaining('/auth/error')
            )
        })

    })

})