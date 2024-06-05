import { ExerciseType } from '../logic/types';

export const KNOWLEDGE_TYPE_READ = 0;
export const KNOWLEDGE_TYPE_WRITE = 1;
export const KNOWLEDGE_TYPE_CLOZE = 2;

export function knowledgeTypeToExercise(type: number): ExerciseType {
	switch (type) {
		case KNOWLEDGE_TYPE_READ:
			return 'read';
		case KNOWLEDGE_TYPE_WRITE:
			return 'write';
		case KNOWLEDGE_TYPE_CLOZE:
			return 'cloze';
		default:
			throw new Error(`Unknown knowledge type: ${type}`);
	}
}
