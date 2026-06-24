import { body } from 'express-validator'
import { PASSWORD_REGEX, hasRepeatingCharacters } from '../utils/password.utils'

export const validateForgotPassword = [

    body('email')
        .trim()
        .normalizeEmail()
        .isEmail()
        .withMessage('Valid email is required')

]

export const validateResetPassword = [

    body('email')
        .trim()
        .normalizeEmail()
        .isEmail()
        .withMessage('Valid email is required'),

    body('otp')
        .notEmpty()
        .withMessage('OTP is required')
        .bail()
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be exactly 6 digits')
        .bail()
        .isNumeric()
        .withMessage('OTP must contain only numbers'),

    body('newPassword')
        .notEmpty()
        .withMessage('New password is required')
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

export const validateChangePassword = [

    body('oldPassword')
        .notEmpty()
        .withMessage('Current password is required'),

    body('newPassword')
        .notEmpty()
        .withMessage('New password is required')
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

export const validateVerifyEmail = [

    body('otp')
        .notEmpty()
        .withMessage('OTP is required')
        .bail()
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be exactly 6 digits')
        .bail()
        .isNumeric()
        .withMessage('OTP must contain only numbers')

]