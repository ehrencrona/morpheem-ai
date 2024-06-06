import { ExerciseType } from '../logic/types';

export const KNOWLEDGE_TYPE_READ = 0;
export const KNOWLEDGE_TYPE_WRITE = 1;
export const KNOWLEDGE_TYPE_CLOZE = 2;
export const KNOWLEDGE_TYPE_TRANSLATE = 3;

const exByType: Record<number, ExerciseType> = {
	[KNOWLEDGE_TYPE_READ]: 'read',
	[KNOWLEDGE_TYPE_WRITE]: 'write',
	[KNOWLEDGE_TYPE_CLOZE]: 'cloze',
	[KNOWLEDGE_TYPE_TRANSLATE]: 'translate'
};

const typeByEx = Object.fromEntries(Object.entries(exByType).map(([k, v]) => [v, parseInt(k)]));

export function knowledgeTypeToExercise(type: number): ExerciseType {
	const res = exByType[type];

	if (res === undefined) {
		throw new Error(`Unknown knowledge type: ${type}`);
	}

	return res;
}

export function exerciseToKnowledgeType(exercise: ExerciseType): number {
	const res = typeByEx[exercise];

	if (res === undefined) {
		throw new Error(`Unknown exercise type: ${exercise}`);
	}

	return res;
}
