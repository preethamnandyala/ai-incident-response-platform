import { Response } from 'express'

export class AppError extends Error {
    statusCode: number

    constructor(message: string, statusCode: number) {
        super(message)
        this.statusCode = statusCode
        this.name = this.constructor.name
        Object.setPrototypeOf(this, AppError.prototype)
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409)
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string) {
        super(message, 401)
    }
}

export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404)
    }
}

export class BadRequestError extends AppError {
    constructor(message: string) {
        super(message, 400)
    }
}

export function handleControllerError(error: unknown, res: Response): void {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message })
    } else {
        console.error(error)
        res.status(500).json({ error: 'Internal server error' })
    }
}