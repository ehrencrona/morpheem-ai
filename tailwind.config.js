/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.svelte'],
	theme: {
		extend: {},
		fontFamily: {
			sans: ['Radio Canada Big'],
			lato: ['Lato']
		},
		fontSize: {
			xxs: '0.5rem',
			xs: '0.75rem',
			sm: '0.875rem',
			base: '1rem',
			lg: '1.125rem',
			xl: '1.25rem',
			'2xl': '1.5rem',
			'3xl': '1.875rem',
			'4xl': '2.25rem',
			'5xl': '3rem'
		},
		colors: {
			red: '#E63946',
			'blue-1': '#F1FAEE',
			'blue-2': '#A8DADC',
			'blue-3': '#457B9D',
			'blue-4': '#1D3557'
		}
	},
	plugins: []
};