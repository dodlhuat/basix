import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
    {
        files: ['src/**/*.ts'],
        extends: [
            ...tseslint.configs.recommended,
        ],
        rules: {
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'explicit' }],
            'no-var': 'error',
            'prefer-const': 'error',
        },
    },
    prettier,
);
