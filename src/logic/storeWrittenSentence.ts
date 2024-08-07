import { KNOWLEDGE_TYPE_WRITE } from '../db/knowledgeTypes';
import { addSeenSentence } from '../db/sentencesSeen';
import { getMultipleWordsByLemmas } from '../db/words';
import { addWrittenSentence } from '../db/writtenSentences';
import { addSentence } from './addSentence';
import { lemmatizeSentences } from './lemmatize';
import { toWordStrings } from './toWordStrings';
import { Language } from './types';

export async function storeWrittenSentence({
	sentence: sentenceString,
	entered,
	wordId,
	userId,
	language
}: {
	sentence: string;
	entered: string;
	wordId?: number;
	userId: number;
	language: Language;
}) {
	console.log(`Storing sentence "${entered}" by user ${userId}.`);

	const wordStrings = toWordStrings(sentenceString, language);
	const [lemmatized] = await lemmatizeSentences([sentenceString], { language });

	const [sentence, words] = await Promise.all([
		addSentence(sentenceString, {
			english: undefined,
			lemmas: lemmatized,
			language,
			userId
		}),

		getMultipleWordsByLemmas(lemmatized, language),

		addWrittenSentence({
			sentence: sentenceString,
			entered,
			wordId,
			userId,
			language
		})
	]);

	await addSeenSentence(sentence.id, userId, language);

	let nonEntered: string[] = [];

	const lowerCaseEntered = entered.toLowerCase();

	const knowledge = words
		.filter((word) => {
			const index = lemmatized.indexOf(word.word);

			let conjugated = wordStrings[index];

			if (conjugated == null) {
				console.warn(`Could not find word ${word.word} in ${sentenceString}`);

				conjugated = word.word;
			}

			const wasEntered = lowerCaseEntered.includes(conjugated);

			if (!wasEntered) {
				nonEntered.push(conjugated);
			}

			return wasEntered;
		})
		.map((word) => ({
			word,
			wordId: word.id,
			isKnown: true,
			sentenceId: sentence.id,
			type: KNOWLEDGE_TYPE_WRITE,
			userId
		}));

	if (nonEntered.length > 0) {
		console.log(
			`The following words were in the correction but not in the original sentence: ${nonEntered.join(', ')}`
		);
	}

	return { sentence, lemmatized, knowledge };
}
