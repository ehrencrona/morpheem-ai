import { POLISH } from '../../constants';
import { getSentencesWithWord } from '../../db/sentences';
import { getWordByLemma } from '../../db/words';
import { units } from './syllabus';

const MIN_COUNT = 10;

for (let unit = 1; unit <= units.length; unit++) {
	let wordsMissing: { word: string; missing: number }[] = [];

	for (const word of units[unit - 1].words) {
		try {
			const wordId = (await getWordByLemma(word, POLISH)).id;

			const sentences = await getSentencesWithWord(wordId, {
				language: POLISH,
				unit
			});

			if (sentences.length == 0) {
				console.log(`${word}, unit ${unit}: ${sentences.length}`);
			}
			// if (sentences.length < MIN_COUNT) {
			// 	//console.log(`${word}, unit ${unit}: ${sentences.length}`);

			// 	wordsMissing.push({ word, missing: MIN_COUNT - sentences.length });
			// }
		} catch (e) {
			console.error(`Error for word ${word}: ${e}`);
		}
	}

	// console.log(`${JSON.stringify(wordsMissing)}`);
}
