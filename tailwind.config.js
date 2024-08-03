/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.svelte'],
	theme: {
		extend: {},
		fontFamily: {
			sans: ['Noto Sans Display'],
			lato: ['Lato']
		},
		fontSize: {
			xxs: '0.6rem',
			xs: '0.9rem',
			sm: '1rem',
			base: '1.1rem',
			lg: '1.25rem',
			xl: '1.5rem',
			'2xl': '1.75rem',
			'3xl': '2rem',
			'4xl': '2.25rem',
			'5xl': '3rem'
		},
		colors: {
			red: '#E63946',
			green: '#2A9D8F',
			orange: '#E77C51',
			'light-gray': '#F1F2F3',
			gray: '#E5E5E5',
			white: '#FFFFFF',
			'darker-gray': '#c4c4c4',
			'blue-1': '#e9f5ff',
			'blue-2': '#A8DADC',
			'blue-3': '#457B9D',
			'blue-3-hover': '#3a6f8b',
			'blue-4': '#1D3557',
			'blue-4-hover': '#1a2d46',
			'gray-1': '#777777',
			offwhite: '#f8f9fa',
			yellow: '#FFD700',
			'morpheem-red': '#d7495f',
			'morpheem-darkred': '#b33a4b'
		}
	},
	plugins: []
};
