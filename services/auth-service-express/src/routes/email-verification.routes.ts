import { Router, Request, Response } from 'express'
import { EmailVerificationController } from '../controllers/email-verification.controller'
import { EmailVerificationService } from '../services/email-verification.service'
import { UserRepository } from '../repositories/user.repository'
import { validateVerifyEmail } from '../validators/password.validator'
import { validateRequest } from '../middlewares/validateRequest'
import { authenticateJWT } from '../middlewares/auth.middleware'

const userRepository = new UserRepository()
const emailVerificationService = new EmailVerificationService(userRepository)
const emailVerificationController = new EmailVerificationController(emailVerificationService)

const router = Router()

router.post('/verify-email',
    authenticateJWT,
    validateVerifyEmail,
    validateRequest,
    (req: Request, res: Response) => emailVerificationController.verifyEmail(req, res)
)

router.post('/resend-verification',
    authenticateJWT,
    (req: Request, res: Response) => emailVerificationController.resendVerificationOTP(req, res)
)

export default router