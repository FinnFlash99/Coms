import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		},
		rules: {
			// TypeScript already checks this; the core rule doesn't understand Svelte 5's
			// `generics="T"` script attribute and false-positives on the type parameter.
			'no-undef': 'off'
		}
	},
	{
		// design/ is a Claude Design export: vendored/generated runtime and design-system
		// files that get wholesale replaced by scripts/update-design.sh, not hand-maintained
		// app source, so they're excluded from lint the same way build output is.
		ignores: ['build/', '.svelte-kit/', 'dist/', 'node_modules/', '.wrangler/', 'design/']
	}
);
