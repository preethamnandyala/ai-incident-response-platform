module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: 'tsconfig.test.json'
        }]
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/server.ts',
        '!src/types/**',
        '!src/repositories/**',
        '!src/config/**'
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    }
}