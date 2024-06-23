import { Language } from './types';
import { generateCloze as generateClozeAi } from '../ai/generateCloze';
import { filterUndefineds } from '$lib/filterUndefineds';

export interface Cloze {
	exercise: string;
	answer: string;
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
	const res = await generateClozeAi(skill, { numberOfExercises: noOfExercises, language });

	const exercises = res.exercises
		.filter((exercise: any) => exercise.isCorrect)
		.map(({ cloze }) => cloze);

	let clozes = filterUndefineds(
		exercises.map((exercise: string) => {
			const regexp = /_+ \(([a-zA-ZáéíóúüñÁÉÍÓÚÜÑ-가-힣]+)\)/;

			const m = exercise.match(regexp);

			if (m && !!m[1]) {
				return {
					exercise: exercise.replace(regexp, '___'),
					answer: m[1]
				};
			} else {
				console.warn(`Did not find placeholder in cloze exercise ${exercise}`);
			}
		})
	);

	if (!clozes.length) {
		throw new Error('No cloze exercises found');
	}

	return clozes;
}
