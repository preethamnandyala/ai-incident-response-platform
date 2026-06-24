import { Router, Request, Response } from 'express'
import { PasswordController } from '../controllers/password.controller'
import { PasswordService } from '../services/password.service'
import { UserRepository } from '../repositories/user.repository'
import {
    validateForgotPassword,
    validateResetPassword,
    validateChangePassword
} from '../validators/password.validator'
import { validateRequest } from '../middlewares/validateRequest'
import { authenticateJWT } from '../middlewares/auth.middleware'

const userRepository = new UserRepository()
const passwordService = new PasswordService(userRepository)
const passwordController = new PasswordController(passwordService)

const router = Router()

router.post('/forgot-password',
    validateForgotPassword,
    validateRequest,
    (req: Request, res: Response) => passwordController.forgotPassword(req, res)
)

router.post('/reset-password',
    validateResetPassword,
    validateRequest,
    (req: Request, res: Response) => passwordController.resetPassword(req, res)
)

router.post('/change-password',
    authenticateJWT,
    validateChangePassword,
    validateRequest,
    (req: Request, res: Response) => passwordController.changePassword(req, res)
)

export default router