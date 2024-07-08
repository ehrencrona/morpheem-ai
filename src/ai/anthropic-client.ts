import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string;

export const anthropic = new Anthropic({
	apiKey: ANTHROPIC_API_KEY
});
