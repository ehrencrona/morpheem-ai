import { logError } from '$lib/logError';
import { generateCloze as generateClozeAi } from '../ai/generateCloze';
import { Language } from './types';

export interface Cloze {
	cloze: string;
	englishMissingPart: string;
	rightAnswer: string;
}

/** Make up cloze exercises for a certain skill */
export async function generateCloze(
	skill: string,
	{
		noOfExercises,
		language
	}: {
		noOfExercises: number;
		language: Language;
	}
): Promise<Cloze[]> {
	console.log(`Generating cloze for skill "${skill}"...`);

	const res = await generateClozeAi(skill, { numberOfExercises: noOfExercises, language });

	const clozes = res.exercises.filter((exercise) => {
		if (!exercise.cloze.match(/\b_+\b/g)) {
			logError(`Cloze does not contain a placeholder: ${exercise.cloze}`);

			return false;
		}

		if (new Array(...exercise.cloze.matchAll(/\b_+\b/g)).length > 1) {
			logError(`Cloze contains multiple placeholders: ${exercise.cloze}`);

			return false;
		}

		exercise.cloze = exercise.cloze.replace(/\b_+\b/g, '___');

		// remove anything in parenthesis right after the underscores, so either ___ (bla) or ___ [bla]
		// it sometimes wants to put the right answer there
		exercise.cloze = exercise.cloze.replace(/___\s*\(.*?\)/, '___');
		exercise.cloze = exercise.cloze.replace(/___\s*\[.*?\]/, '___');

		return true;
	});

	if (!clozes.length) {
		throw new Error('No cloze exercises found');
	}

	return clozes;
}
