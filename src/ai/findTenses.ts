import { z } from 'zod';
import { askForJson } from './askForJson';
import { Language } from '../logic/types';

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
        For example the sentence "El plato de pasta era tan grande que no pude terminarlo." uses the preterite and the imperfect.

        ${sentences.map((s) => `#${s.id}. ${s.sentence}`).join('\n')}
        
        Return JSON  in the form 
      { "tenses": [ { id: 123, tenses: [ "preterite", "imperfect"] } ] )`
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
