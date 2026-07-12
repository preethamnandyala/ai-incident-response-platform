import morgan from 'morgan'
import { v4 as uuidv4 } from 'uuid'
import { Request, Response, NextFunction } from 'express'

export const requestId = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const id = uuidv4()
    req.headers['x-request-id'] = id
    res.setHeader('x-request-id', id)
    next()
}

export const logger = morgan(
    ':method :url :status :res[content-length] - :response-time ms - id::req[x-request-id]'
)