import { OAuthService } from '../src/services/oauth.service'
import { UserRepository } from '../src/repositories/user.repository'
import { mockGoogleUser, mockUnverifiedUser } from './fixtures'

jest.mock('../src/repositories/user.repository')

const mockUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>

describe('OAuthService', () => {

    let oauthService: OAuthService

    beforeEach(() => {
        jest.clearAllMocks()
        oauthService = new OAuthService(new UserRepository())
    })

    describe('handleGoogleCallback', () => {

        it('should create new user when no account exists', async () => {
            mockUserRepository.prototype.findByGoogleId.mockResolvedValue(null)
            mockUserRepository.prototype.findByEmail.mockResolvedValue(null)
            mockUserRepository.prototype.createGoogleUser.mockResolvedValue(mockGoogleUser)
            mockUserRepository.prototype.saveRefreshToken.mockResolvedValue(undefined)

            const result = await oauthService.handleGoogleCallback(
                'google_123', 'hari@example.com', 'Hari'
            )

            expect(mockUserRepository.prototype.createGoogleUser).toHaveBeenCalledWith(
                'Hari', 'hari@example.com', 'google_123'
            )
            expect(result).toHaveProperty('accessToken')
            expect(result).toHaveProperty('refreshToken')
            expect(result.user).toHaveProperty('email', 'hari@example.com')
        })

        it('should issue JWT when user already has Google linked', async () => {
            mockUserRepository.prototype.findByGoogleId.mockResolvedValue(mockGoogleUser)
            mockUserRepository.prototype.saveRefreshToken.mockResolvedValue(undefined)

            const result = await oauthService.handleGoogleCallback(
                'google_123', 'hari@example.com', 'Hari'
            )

            expect(mockUserRepository.prototype.findByEmail).not.toHaveBeenCalled()
            expect(mockUserRepository.prototype.createGoogleUser).not.toHaveBeenCalled()
            expect(result).toHaveProperty('accessToken')
        })

        it('should link Google account when email exists and is verified', async () => {
            mockUserRepository.prototype.findByGoogleId.mockResolvedValue(null)
            mockUserRepository.prototype.findByEmail.mockResolvedValue(mockGoogleUser)
            mockUserRepository.prototype.linkGoogleAccount.mockResolvedValue(undefined)
            mockUserRepository.prototype.saveRefreshToken.mockResolvedValue(undefined)

            const result = await oauthService.handleGoogleCallback(
                'google_123', 'hari@example.com', 'Hari'
            )

            expect(mockUserRepository.prototype.linkGoogleAccount).toHaveBeenCalledWith(
                '123', 'google_123'
            )
            expect(result).toHaveProperty('accessToken')
        })

        it('should throw when email exists but is not verified', async () => {
            mockUserRepository.prototype.findByGoogleId.mockResolvedValue(null)
            mockUserRepository.prototype.findByEmail.mockResolvedValue(mockUnverifiedUser)

            await expect(
                oauthService.handleGoogleCallback(
                    'google_123', 'hari@example.com', 'Hari'
                )
            ).rejects.toThrow('Please verify your email before linking your Google account')
        })

    })

})