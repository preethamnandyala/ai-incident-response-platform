import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { authenticateJWT } from '../src/middlewares/auth.middleware'
import { env } from '../src/config/env'

describe('authenticateJWT', () => {

    let req: Partial<Request>
    let res: Partial<Response>
    let next: NextFunction
    let statusMock: jest.Mock
    let jsonMock: jest.Mock

    beforeEach(() => {
        jsonMock = jest.fn()
        statusMock = jest.fn().mockReturnValue({ json: jsonMock })
        next = jest.fn() as unknown as NextFunction

        req = { headers: {} }
        res = { status: statusMock }
    })

    it('should call next when valid token is provided', () => {
        const token = jwt.sign(
            { userId: '123', role: 'DEVELOPER' },
            env.jwt.accessSecret,
            { expiresIn: '15m' }
        )

        req.headers = { authorization: `Bearer ${token}` }

        authenticateJWT(req as Request, res as Response, next)

        expect(next).toHaveBeenCalled()
        expect((req as any).user).toEqual(
            expect.objectContaining({ userId: '123', role: 'DEVELOPER' })
        )
    })

    it('should return 401 when no authorization header', () => {
        req.headers = {}

        authenticateJWT(req as Request, res as Response, next)

        expect(statusMock).toHaveBeenCalledWith(401)
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Authentication required' })
        expect(next).not.toHaveBeenCalled()
    })

    it('should return 401 when header does not start with Bearer', () => {
        req.headers = { authorization: 'Basic abc123' }

        authenticateJWT(req as Request, res as Response, next)

        expect(statusMock).toHaveBeenCalledWith(401)
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Authentication required' })
        expect(next).not.toHaveBeenCalled()
    })

    it('should return 401 when token is invalid', () => {
        req.headers = { authorization: 'Bearer invalid-token-value' }

        authenticateJWT(req as Request, res as Response, next)

        expect(statusMock).toHaveBeenCalledWith(401)
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
        expect(next).not.toHaveBeenCalled()
    })

    it('should return 401 when token is expired', () => {
        const expiredToken = jwt.sign(
            { userId: '123', role: 'DEVELOPER' },
            env.jwt.accessSecret,
            { expiresIn: '0s' }
        )

        req.headers = { authorization: `Bearer ${expiredToken}` }

        authenticateJWT(req as Request, res as Response, next)

        expect(statusMock).toHaveBeenCalledWith(401)
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
        expect(next).not.toHaveBeenCalled()
    })

})