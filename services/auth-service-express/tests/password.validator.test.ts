import { validateForgotPassword, validateResetPassword, validateChangePassword } from '../src/validators/password.validator'
import { validationResult } from 'express-validator'
import { Request } from 'express'

const runValidation = async (
    validators: any[],
    body: Record<string, any>
) => {
    const req = {
        body,
        headers: {},
        cookies: {}
    } as unknown as Request

    for (const validator of validators) {
        await validator.run(req)
    }

    return validationResult(req)
}

describe('Password Validators', () => {

    describe('validateForgotPassword', () => {

        it('should pass with valid email', async () => {
            const result = await runValidation(validateForgotPassword, {
                email: 'hari@example.com'
            })
            expect(result.isEmpty()).toBe(true)
        })

        it('should fail with invalid email', async () => {
            const result = await runValidation(validateForgotPassword, {
                email: 'notanemail'
            })
            expect(result.isEmpty()).toBe(false)
            expect(result.array()[0].msg).toBe('Valid email is required')
        })

    })

    describe('validateResetPassword', () => {

        it('should pass with valid data', async () => {
            const result = await runValidation(validateResetPassword, {
                email: 'hari@example.com',
                otp: '123456',
                newPassword: 'SecurePass1!'
            })
            expect(result.isEmpty()).toBe(true)
        })

        it('should fail when OTP is not 6 digits', async () => {
            const result = await runValidation(validateResetPassword, {
                email: 'hari@example.com',
                otp: '123',
                newPassword: 'SecurePass1!'
            })
            expect(result.isEmpty()).toBe(false)
            expect(result.array()[0].msg).toBe('OTP must be exactly 6 digits')
        })

        it('should fail when OTP contains letters', async () => {
            const result = await runValidation(validateResetPassword, {
                email: 'hari@example.com',
                otp: '12345a',
                newPassword: 'SecurePass1!'
            })
            expect(result.isEmpty()).toBe(false)
            expect(result.array()[0].msg).toBe('OTP must contain only numbers')
        })

        it('should fail when newPassword is too weak', async () => {
            const result = await runValidation(validateResetPassword, {
                email: 'hari@example.com',
                otp: '123456',
                newPassword: 'weak'
            })
            expect(result.isEmpty()).toBe(false)
            expect(result.array()[0].msg).toBe('Password must be at least 8 characters')
        })

        it('should fail when newPassword has repeating characters', async () => {
            const result = await runValidation(validateResetPassword, {
                email: 'hari@example.com',
                otp: '123456',
                newPassword: 'Seeecure1!'
            })
            expect(result.isEmpty()).toBe(false)
            expect(result.array()[0].msg).toBe(
                'Password cannot have more than 2 consecutive repeating characters'
            )
        })

    })

    describe('validateChangePassword', () => {

        it('should pass with valid data', async () => {
            const result = await runValidation(validateChangePassword, {
                oldPassword: 'AnyOldPassword',
                newPassword: 'NewSecurePass1!'
            })
            expect(result.isEmpty()).toBe(true)
        })

        it('should fail when oldPassword is missing', async () => {
            const result = await runValidation(validateChangePassword, {
                oldPassword: '',
                newPassword: 'NewSecurePass1!'
            })
            expect(result.isEmpty()).toBe(false)
            expect(result.array()[0].msg).toBe('Current password is required')
        })

        it('should fail when newPassword has no special character', async () => {
            const result = await runValidation(validateChangePassword, {
                oldPassword: 'AnyOldPassword',
                newPassword: 'NewSecurePass1'
            })
            expect(result.isEmpty()).toBe(false)
            expect(result.array()[0].msg).toBe(
                'Password must contain uppercase, lowercase, number, and special character'
            )
        })

        it('should fail when newPassword has repeating characters', async () => {
            const result = await runValidation(validateChangePassword, {
                oldPassword: 'AnyOldPassword',
                newPassword: 'Seeecure1!'
            })
            expect(result.isEmpty()).toBe(false)
            expect(result.array()[0].msg).toBe(
                'Password cannot have more than 2 consecutive repeating characters'
            )
        })

    })

})