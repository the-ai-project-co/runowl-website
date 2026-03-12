import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
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
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: {
					// Use the TS parser for <script lang="ts"> blocks
					ts: '@typescript-eslint/parser',
				},
			},
		},
	},
	{
		ignores: [
			'.svelte-kit/**',
			'.vercel/**',
			'node_modules/**',
			'build/**',
		],
	},
];
