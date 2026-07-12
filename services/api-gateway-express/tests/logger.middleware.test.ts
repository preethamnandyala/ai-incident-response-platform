import { Request, Response, NextFunction } from 'express'
import { requestId } from '../src/middlewares/logger.middleware'

describe('requestId middleware', () => {

    let req: Partial<Request>
    let res: Partial<Response>
    let next: NextFunction
    let setHeaderMock: jest.Mock

    beforeEach(() => {
        setHeaderMock = jest.fn()
        next = jest.fn() as unknown as NextFunction
        req = { headers: {} }
        res = { setHeader: setHeaderMock }
    })

    it('should generate a request ID and attach to req headers', () => {
        requestId(req as Request, res as Response, next)

        expect(req.headers!['x-request-id']).toBeDefined()
        expect(typeof req.headers!['x-request-id']).toBe('string')
        expect((req.headers!['x-request-id'] as string).length).toBeGreaterThan(0)
    })

    it('should set x-request-id on response headers', () => {
        requestId(req as Request, res as Response, next)

        expect(setHeaderMock).toHaveBeenCalledWith(
            'x-request-id',
            expect.any(String)
        )
    })

    it('should call next after setting request ID', () => {
        requestId(req as Request, res as Response, next)

        expect(next).toHaveBeenCalled()
    })

    it('should generate unique IDs for different requests', () => {
        const req1 = { headers: {} } as Partial<Request>
        const req2 = { headers: {} } as Partial<Request>
        const res1 = { setHeader: jest.fn() } as Partial<Response>
        const res2 = { setHeader: jest.fn() } as Partial<Response>

        requestId(req1 as Request, res1 as Response, next)
        requestId(req2 as Request, res2 as Response, next)

        expect(req1.headers!['x-request-id']).not.toBe(req2.headers!['x-request-id'])
    })

})