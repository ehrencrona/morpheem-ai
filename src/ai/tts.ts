import { openai } from './openai-client';

export async function tts(text: string) {
	const response = await openai.audio.speech.create({
		input: text,
		model: 'tts-1',
		voice: 'fable',
		response_format: 'opus',
		speed: 0.8
	});

	return response;
}
