import { Language } from '../logic/types';
import { ask } from './ask';

export async function simplifyText(
	text: string,
	{ language, hardWords }: { language: Language; hardWords?: string[] }
): Promise<string> {
	return ask({
		messages: [
			{
				role: 'system',
				content:
					`Rewrite the following text in simpler ${language.name}. Reformulate difficult terms in simpler words. Some changes in meaning are acceptable if necessary to simplify the text.` +
					(hardWords?.length
						? ` Some of these words might be difficult: ${hardWords.join(', ')}.`
						: '')
			},
			{
				role: 'user',
				content: text
			}
		],
		temperature: 1,
		model: 'claude-3-5-sonnet-20240620'
	});
}
