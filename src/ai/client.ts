import OpenAI from 'openai';

const OPENAI_API_KEY = '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';

export const openai = new OpenAI({
	apiKey: OPENAI_API_KEY
});
