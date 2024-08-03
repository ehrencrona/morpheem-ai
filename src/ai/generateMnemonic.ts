import { Language } from '../logic/types';
import { ask } from './ask';

export async function generateMnemonic(word: string, language: Language) {
	const completion = await ask({
		model: 'gpt-4o',
		messages: [
			{
				role: 'user',
				content: `I'm looking for a mnemonic or association to learn the ${language.name} word "${word}". First give me one paragraph with some associations, like word parts, etymology or similar sounding words in English or ${language.name}. Then, write "Mnemonic:" a summarize the above as a single sentence that helps me remember: either a breakdown of the word, a similar word in a language I know or a mnemonic.`
			}
		],
		temperature: 1,
		logResponse: true
	});

	const mnemonic = completion
		.split('\n')
		.filter((s) => !!s.trim())
		.pop()!
		.replace(/\*\*/g, '')
		.replace(/Mnemonic: /, '')
		.replace(/^"|"$/g, '');

	return mnemonic;
}
