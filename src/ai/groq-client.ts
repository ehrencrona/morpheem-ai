import Groq from 'groq-sdk';

export const MODEL = 'llama3-8b-8192';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;

export const groq = new Groq({
	apiKey: GROQ_API_KEY
});
