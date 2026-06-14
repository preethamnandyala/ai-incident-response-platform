import { Router, Request, Response } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { AuthService } from '../services/auth.service'
import { UserRepository } from '../repositories/user.repository'
import { validateSignup, validateLogin } from '../validators/auth.validator'
import { validateRequest } from '../middlewares/validateRequest'
import { authenticateJWT } from '../middlewares/auth.middleware'

const userRepository = new UserRepository()
const authService = new AuthService(userRepository)
const authController = new AuthController(authService)

const router = Router()

router.post('/signup',
    validateSignup,
    validateRequest,
    (req: Request, res: Response) => authController.signup(req, res)
)

router.post('/login',
    validateLogin,
    validateRequest,
    (req: Request, res: Response) => authController.login(req, res)
)

router.post('/logout',
    authenticateJWT,
    (req: Request, res: Response) => authController.logout(req, res)
)

router.post('/refresh',
    (req: Request, res: Response) => authController.refresh(req, res)
)

router.get('/me',
    authenticateJWT,
    (req: Request, res: Response) => authController.me(req, res)
)

export default router