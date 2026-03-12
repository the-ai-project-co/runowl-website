import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
	js.configs.recommended,
	...svelte.configs['flat/recommended'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
	},
	{
		// TypeScript source files
		files: ['**/*.ts'],
		languageOptions: {
			parser: tsParser,
			globals: {
				// Svelte 5 runes are compiler-injected globals
				$state: 'readonly',
				$derived: 'readonly',
				$effect: 'readonly',
				$props: 'readonly',
				$bindable: 'readonly',
				$inspect: 'readonly',
				$host: 'readonly',
			},
		},
	},
	{
		// Svelte files with TS script blocks
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: tsParser,
			},
		},
	},
	{
		// TypeScript declaration files — interfaces/types are always "unused" by design
		files: ['**/*.d.ts'],
		rules: {
			'no-unused-vars': 'off',
		},
	},
	{
		rules: {
			// Plain <a> tags don't need goto()
			'svelte/no-navigation-without-resolve': 'off',
			// svelte-ignore comment names changed between Svelte versions — don't error on old names
			'svelte/no-unused-svelte-ignore': 'off',
			// Warn rather than error for missing {#each} keys and reactivity — pre-existing code
			'svelte/require-each-key': 'warn',
			'svelte/prefer-svelte-reactivity': 'warn',
		},
	},
	{
		ignores: ['.svelte-kit/**', '.vercel/**', 'node_modules/**', 'build/**'],
	},
];
