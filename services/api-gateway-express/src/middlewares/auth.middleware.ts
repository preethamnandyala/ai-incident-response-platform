import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export const authenticateJWT = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authentication required' })
        return
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = jwt.verify(
            token,
            env.jwt.accessSecret
        ) as { userId: string, role: string, organizationId?: string }

        req.headers['x-user-id'] = decoded.userId
        req.headers['x-user-role'] = decoded.role
        req.headers['x-organization-id'] = decoded.organizationId || 'default'

        next()
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' })
        return
    }
}