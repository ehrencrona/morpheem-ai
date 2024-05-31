import OpenAI from 'openai';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;

export const openai = new OpenAI({
	apiKey: OPENAI_API_KEY
});
