module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: 'frontend/tsconfig.json',
		sourceType: 'module',
	},
	plugins: [
		'@typescript-eslint/eslint-plugin',
		'prettier'
	],
	extends: [
		'airbnb-typescript/base',
		'plugin:@typescript-eslint/recommended',
		'plugin:prettier/recommended',
		'plugin:import/recommended',
	],
	root: true,
	env: {
		node: true,
		jest: true,
	},
	ignorePatterns: ['.eslintrc.js'],
	rules: {
		'@typescript-eslint/interface-name-prefix': 'off',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/lines-between-class-members': 'off',
		'indent': ['error', 'tab'],
	},
};
