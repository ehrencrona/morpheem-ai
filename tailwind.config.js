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
			xs: '0.8rem',
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
			green: '#2A9D8F',
			'light-gray': '#F1F2F3',
			gray: '#E5E5E5',
			white: '#FFFFFF',
			'darker-gray': '#c4c4c4',
			'blue-1': '#F1FAEE',
			'blue-2': '#A8DADC',
			'blue-3': '#457B9D',
			'blue-4': '#1D3557',
			'gray-1': '#777777',
			yellow: '#FFD700'
		}
	},
	plugins: []
};
