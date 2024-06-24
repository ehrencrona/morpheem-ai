import type { getAggregateKnowledgeForUser } from '../../../../db/knowledge';
import type { ExerciseKnowledge, WordKnowledge } from '../../../../logic/types';
import { apiCall } from '../api-call';

export async function fetchAggregateKnowledge(): ReturnType<typeof getAggregateKnowledgeForUser> {
	return apiCall('/api/knowledge', {});
}

export async function sendKnowledge(words: WordKnowledge[], userExercises?: ExerciseKnowledge[]) {
	if (words.length == 0 && (!userExercises || userExercises.length == 0)) {
		return;
	}

	return apiCall('/api/knowledge', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ words, userExercises })
	});
}
