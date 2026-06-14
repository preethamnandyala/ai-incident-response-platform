import { body } from 'express-validator'
import { PASSWORD_REGEX, hasRepeatingCharacters } from '../utils/password.utils'

export const validateSignup = [

    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .bail()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be at least 2 characters')
        .bail()
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

    body('email')
        .trim()
        .normalizeEmail()
        .isEmail()
        .withMessage('Valid email is required'),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .bail()
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be at least 8 characters')
        .bail()
        .matches(PASSWORD_REGEX)
        .withMessage('Password must contain uppercase, lowercase, number, and special character')
        .bail()
        .custom((value: string) => {
            if (hasRepeatingCharacters(value)) {
                throw new Error('Password cannot have more than 2 consecutive repeating characters')
            }
            return true
        })

]

export const validateLogin = [

    body('email')
        .trim()
        .normalizeEmail()
        .isEmail()
        .withMessage('Valid email is required'),

    body('password')
        .notEmpty()
        .withMessage('Password is required')

]