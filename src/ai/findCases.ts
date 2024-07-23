import { z } from 'zod';
import { askForJson } from './askForJson';

export async function findCases(sentences: { id: number; sentence: string }[]) {
	const res = await askForJson({
		messages: [
			{
				role: 'user',
				content: `
        List all the cases the following Polish sentences use. 
        For example the sentence "Będę pracować nad swoim projektem cały dzień." uses the instrumental singular and the accusative singular.

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
