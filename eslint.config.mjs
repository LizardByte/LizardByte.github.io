import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginJest from 'eslint-plugin-jest';

export default [
    pluginJs.configs.recommended,
    {
        ignores: [
            'coverage/**',
            'node_modules/**',
        ],
    },
    {
        files: ['assets/js/release-versions.js'],
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
    },
    {
        files: ['tests/**/*.test.cjs'],
        ...pluginJest.configs['flat/recommended'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },
        rules: {
            'jest/no-disabled-tests': 'error',
            'jest/no-focused-tests': 'error',
            'jest/no-identical-title': 'error',
            'jest/prefer-to-have-length': 'error',
            'jest/valid-expect': 'error',
        },
    },
];
