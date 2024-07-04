import { z } from 'zod';
import { Language, LanguageCode } from '../logic/types';
import { askForJson } from './askForJson';
import { Sentence } from '../db/types';

export interface Clause {
	sentence: string;
	english: string;
}

const examples: Record<LanguageCode, string> = {
	pl: `"Nie mogę skupić się, gdy wokół mnie jest bałagan."
"I can't focus when there's a mess around me."

breaks down to 

[["nie mogę skupić się", "I can't focus"], ["gdy", "when"], ["wokół mnie", "around me"], ["jest", "there's"], ["bałagan", "a mess"]]
`,
	fr: `"Il a dit qu'il n'aurait pas le temps de le faire."
"He said he wouldn't have time to do it."

breaks down to

[["il a dit", "he said"], ["qu'il n'aurait pas le temps", "he wouldn't have time"], ["de le faire", "to do it"]]
`,
	es: `"Mañana vamos a intentar resolver ese problema."
"Tomorrow we're going to try to solve that problem."

breaks down to

[["mañana", "Tomorrow"], ["vamos a intentar", "we're going to try"], ["resolver ese problema", "to solve that problem"]]
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

breaks down to

[˝["Он сказал", "He said"], ["что", "that"], ["завтра", "tomorrow"], ["будет дождь", "will be rain"]]
`
};

export async function splitIntoClauses(
	{ sentence, english }: Pick<Sentence, 'sentence' | 'english'>,
	language: Language
): Promise<Clause[]> {
	const res = await askForJson({
		messages: [
			{
				role: 'system',
				content: `Break down the following ${language.name} sentence(s) into the shortest clauses and return each clause together with the part of the English translation it corresponds to (written exactly as in the sentence translation). 

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
		model: 'gpt-3.5-turbo'
	});

	return res.clauses.map(([sentence, english]) => ({ sentence, english }));
}
