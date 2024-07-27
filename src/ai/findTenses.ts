import { z } from 'zod';
import { askForJson } from './askForJson';
import { Language, LanguageCode } from '../logic/types';

const examples: Record<LanguageCode, string | undefined> = {
	es: '"El plato de pasta era tan grande que no pude terminarlo." uses the preterite and the imperfect.',
	ru: '"Я понял, что ты мне не веришь." uses the past and the present.',
	ko: '',
	nl: '',
	pl: '',
	sv: '',
	fr: ''
};

const tenses: Record<LanguageCode, string[]> = {
	es: ['preterite', 'imperfect'],
	ru: ['past', 'present'],
	ko: [],
	nl: [],
	pl: [],
	sv: [],
	fr: []
};

export async function findTenses(
	sentences: { id: number; sentence: string }[],
	language: Language
) {
	const res = await askForJson({
		messages: [
			{
				role: 'user',
				content: `
        List all the tenses the following ${language.name} sentences use. 
        For example the sentence ${examples[language.code]}

        ${sentences.map((s) => `#${s.id}. ${s.sentence}`).join('\n')}
        
        Return JSON  in the form 
      { "tenses": [ { id: 123, tenses: ${JSON.stringify(tenses[language.code])} } ] )`
			}
		],
		model: 'gpt-4o',
		temperature: 0,
		schema: z.object({
			tenses: z.array(
				z.object({
					id: z.number(),
					tenses: z.array(z.string())
				})
			)
		})
	});

	return res;
}
