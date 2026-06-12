import { validateSignup, validateLogin } from '../src/validators/auth.validator'
import { validationResult } from 'express-validator'
import { Request } from 'express'

// Helper function to run validators against mock request data
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

describe('Auth Validators', () => {

    describe('validateSignup', () => {

        it('should pass with valid signup data', async () => {
            const result = await runValidation(validateSignup, {
                name: 'Hari Preetham',
                email: 'hari@example.com',
                password: 'SecurePass1!'
            })
            expect(result.isEmpty()).toBe(true)
        })

        it('should fail when name is empty', async () => {
            const result = await runValidation(validateSignup, {
                name: '',
                email: 'hari@example.com',
                password: 'SecurePass1!'
            })
            expect(result.isEmpty()).toBe(false)
            expect(result.array()[0].msg).toBe('Name is required')
        })

        it('should fail when name is too short', async () => {
            const result = await runValidation(validateSignup, {
                name: 'H',
                email: 'hari@example.com',
                password: 'SecurePass1!'
            })
            expect(result.isEmpty()).toBe(false)
            expect(result.array()[0].msg).toBe('Name must be at least 2 characters')
        })

        it('should fail when email is invalid', async () => {
            const result = await runValidation(validateSignup, {
                name: 'Hari',
                email: 'notanemail',
                password: 'SecurePass1!'
            })
            expect(result.isEmpty()).toBe(false)
            expect(result.array()[0].msg).toBe('Valid email is required')
        })

        it('should fail when password is too short', async () => {
            const result = await runValidation(validateSignup, {
                name: 'Hari',
                email: 'hari@example.com',
                password: 'Short1!'
            })
            expect(result.isEmpty()).toBe(false)
            expect(result.array()[0].msg).toBe('Password must be at least 8 characters')
        })

        it('should fail when password has no uppercase letter', async () => {
            const result = await runValidation(validateSignup, {
                name: 'Hari',
                email: 'hari@example.com',
                password: 'securepass1!'
            })
            expect(result.isEmpty()).toBe(false)
            expect(result.array()[0].msg).toBe(
                'Password must contain uppercase, lowercase, number, and special character'
            )
        })

        it('should fail when password has more than 2 consecutive repeating characters', async () => {
            const result = await runValidation(validateSignup, {
                name: 'Hari',
                email: 'hari@example.com',
                password: 'Seeecure1!'
            })
            expect(result.isEmpty()).toBe(false)
            expect(result.array()[0].msg).toBe(
                'Password cannot have more than 2 consecutive repeating characters'
            )
        })

        it('should pass when password contains special characters like ? or +', async () => {
            const result = await runValidation(validateSignup, {
                name: 'Hari',
                email: 'hari@example.com',
                password: 'SecurePass1?'
            })
            expect(result.isEmpty()).toBe(true)
        })

        it('should pass when name contains apostrophe', async () => {
            const result = await runValidation(validateSignup, {
                name: "O'Brien",
                email: 'hari@example.com',
                password: 'SecurePass1!'
            })
            expect(result.isEmpty()).toBe(true)
        })

        it('should pass when name contains hyphen', async () => {
            const result = await runValidation(validateSignup, {
                name: 'Anne-Marie',
                email: 'hari@example.com',
                password: 'SecurePass1!'
            })
            expect(result.isEmpty()).toBe(true)
        })

    })

    describe('validateLogin', () => {

        it('should pass with valid login data', async () => {
            const result = await runValidation(validateLogin, {
                email: 'hari@example.com',
                password: 'anypassword'
            })
            expect(result.isEmpty()).toBe(true)
        })

        it('should fail when email is missing', async () => {
            const result = await runValidation(validateLogin, {
                email: '',
                password: 'anypassword'
            })
            expect(result.isEmpty()).toBe(false)
            expect(result.array()[0].msg).toBe('Valid email is required')
        })

        it('should fail when password is missing', async () => {
            const result = await runValidation(validateLogin, {
                email: 'hari@example.com',
                password: ''
            })
            expect(result.isEmpty()).toBe(false)
            expect(result.array()[0].msg).toBe('Password is required')
        })

    })

})