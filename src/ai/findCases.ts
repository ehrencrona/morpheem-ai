import { z } from 'zod';
import { askForJson } from './askForJson';
import { Language, LanguageCode } from '../logic/types';

const examples: Record<LanguageCode, string | undefined> = {
	pl: `"Będę pracować nad swoim projektem cały dzień." uses the instrumental singular and the accusative singular.`,
	ru: `"В проекте нуждаются новые идеи." uses the locative plural and the nominative plural.`,
	fr: '',
	es: '',
	ko: '',
	sv: '',
	nl: ''
};

export async function findCases(sentences: { id: number; sentence: string }[], language: Language) {
	const res = await askForJson({
		messages: [
			{
				role: 'user',
				content: `
        List all the cases the following ${language.name} sentences use. 
        For example the sentence ${examples[language.code]}

        ${sentences.map((s) => `#${s.id}. ${s.sentence}`).join('\n')}
        
        Return JSON  in the form 
      { "cases": [ { id: 123, cases: [ "instrumental singular", "accusative singular"] } ] )`
			}
		],
		model: 'gpt-4o',
		temperature: 0,
		schema: z.object({
			cases: z.array(
				z.object({
					id: z.number(),
					cases: z.array(z.string())
				})
			)
		})
	});

	return res;
}
