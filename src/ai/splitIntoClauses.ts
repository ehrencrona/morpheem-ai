import { z } from 'zod';
import { Language, LanguageCode } from '../logic/types';
import { askForJson } from './askForJson';
import { Clause, Sentence } from '../db/types';

const examples: Record<LanguageCode, string> = {
	pl: `"Nie mogę skupić się, gdy wokół mnie jest bałagan."
"I can't focus when there's a mess around me."

breaks down to 

[["nie mogę", "I can't"], ["skupić się", "focus"], ["gdy", "when"], ["wokół mnie", "around me"], ["jest", "there's"], ["bałagan", "a mess"]]
`,
	fr: `"Il a dit qu'il n'aurait pas le temps de le faire."
"He said he wouldn't have time to do it."

breaks down to

[["il a dit", "he said"], ["qu'il n'aurait pas le temps", "he wouldn't have time"], ["de le faire", "to do it"]]
`,
	es: `"Mañana vamos a intentar resolver ese problema."
"Tomorrow we're going to try to solve that problem."

breaks down to

[["mañana", "Tomorrow"], ["vamos a intentar", "we're going to try"], ["resolver", "to solve"], ["ese problema", "that problem"]]
  `,
	ko: `"오래된 사진첩을 보면서 추억에 잠겼다."
"I got lost in memories while looking at an old photo album."

breaks down to

[["오래된 사진첩을", "an old photo album"], ["보면서", "while looking"], ["추억에 잠겼다", "I got lost in memories"]]
`,
	nl: `"Ik heb het boek dat je me gaf nog steeds niet gelezen."
"I still haven't read the book you gave me."

breaks down to

[["Ik heb", "I have"], ["het boek", "the book"], ["dat je me gaf", "you gave me"], ["nog steeds niet gelezen", "still haven't read"]]
`,
	ru: `"Он сказал, что завтра будет дождь."
"He said that there will be rain tomorrow."

breaks down to

[˝["Он сказал", "He said"], ["что", "that"], ["завтра", "tomorrow"], ["будет дождь", "there will be rain"]]
`,
	sv: `"Ny lagstiftning trädde i kraft den 1 januari."

breaks down to

[["Ny", "New"], ["lagstiftning", "legislation"], ["trädde i kraft", "came into force"], ["den 1 januari", "on January 1st"]]
`
};

const commonPrompt = `determine which part of the translation corresponds to which part of the original sentence. 
Break down the sentence into the shortest fragments that correspond to a part of the English translation. 
Return fragments with their corresponding part of the English translation written exactly as in the English sentence provided. `;

export async function splitIntoClauses(
	{ sentence, english }: Pick<Sentence, 'sentence' | 'english'>,
	language: Language
): Promise<Clause[]> {
	const res = await askForJson({
		messages: [
			{
				role: 'system',
				content: `You will get a ${language.name} sentence and its English translation. We want to ${commonPrompt}

Example
${examples[language.code]}

Return a JSON array of clauses, each an array with the ${language.name} clause followed by the corresponding English clause: {clauses: string[][]}.`
			},
			{
				role: 'user',
				content: sentence + '\n' + english
			}
		],
		temperature: 0.5,
		schema: z.object({ clauses: z.array(z.array(z.string()).min(2).max(2)) }),
		logResponse: true,
		model: 'gpt-4o'
	});

	return res.clauses.map(([sentence, english]) => ({ sentence, english }));
}

export async function splitIntoClausesAndTranslate(
	{ sentence }: Pick<Sentence, 'sentence'>,
	language: Language
): Promise<{ translation: string; clauses: Clause[] }> {
	const res = await askForJson({
		messages: [
			{
				role: 'system',
				content: `You will get a ${language.name} sentence. First translate it into English. Then ${commonPrompt}

Example
${examples[language.code]}

Return a JSON array of clauses, each an array with the ${language.name} clause followed by the corresponding English clause: {translation: string, clauses: string[][]}.`
			},
			{
				role: 'user',
				content: sentence
			}
		],
		temperature: 0.5,
		schema: z.object({
			translation: z.string(),
			clauses: z.array(z.array(z.string()).min(2).max(2))
		}),
		logResponse: true,
		model: 'claude-3-5-sonnet-20240620'
	});

	return {
		translation: res.translation,
		clauses: res.clauses.map(([sentence, english]) => ({ sentence, english }))
	};
}
