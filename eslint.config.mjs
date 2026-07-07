import tsParser from "@typescript-eslint/parser"
import tsPlugin from "@typescript-eslint/eslint-plugin"
import globals from "globals"

export default [
    {
        ignores: [
            'lib/**',
            'dist/**',
            'node_modules/**',
            'coverage/**',
            'test/**'
        ],
    },
    {
        files: ['src/**/*.js', 'src/**/*.cjs', 'src/**/*.mjs'],

        languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
            Atomics: 'readonly',
            SharedArrayBuffer: 'readonly',
        },
        ecmaVersion: 2022, // Support class fields and other modern syntax
        sourceType: 'module' // Match TypeScript module: ESNext
        },
        rules: {
            // Code style - match TypeScript settings
            semi: ['error', 'never'],
            quotes: ['error', 'single'],

            // Strict checking - match TypeScript strictness
            'no-console': 'error',
            'no-unused-vars': 'error', // Match TypeScript noUnusedLocals: true
            'no-undef': 'error',
            strict: ['error', 'global'], // Match TypeScript alwaysStrict: true

            // Additional strictness to match TypeScript behavior
            'no-implicit-globals': 'error',
            'prefer-const': 'error', // Encourage immutability
            'no-var': 'error', // Use let/const only
            'no-redeclare': 'error'
        },
        settings: {
            react: {
                version: "detect",
            },
        },
    },
    {
        files: ['src/**/*.ts'],

        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
            Atomics: 'readonly',
            SharedArrayBuffer: 'readonly',
        },
        parser: tsParser,
        parserOptions: {
            project: './tsconfig.json'
        },
        },
        rules: {
            semi: ['error', 'never'],
            quotes: ['error', 'single'],
            'no-console': ['error', { allow: ['warn', 'error'] }],
            // Disable ESLint rules that TypeScript handles better
            'no-unused-vars': 'off', // TypeScript handles this via noUnusedLocals
            'no-undef': 'off', // TypeScript handles undefined variables
            '@typescript-eslint/no-unused-vars': ['error', {
                vars: 'all',
                varsIgnorePattern: '.*',
                args: 'all',
                argsIgnorePattern: '^_',
                caughtErrors: 'all',
                caughtErrorsIgnorePattern: '^_'
            }],
        },
    }
]

