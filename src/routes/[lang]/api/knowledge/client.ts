import type { getAggregateKnowledgeForUser } from '../../../../db/knowledge';
import type { WordKnowledge } from '../../../../logic/types';
import { apiCall } from '../api-call';

export async function fetchAggregateKnowledge(): ReturnType<typeof getAggregateKnowledgeForUser> {
	return apiCall('/api/knowledge', {});
}

export async function sendKnowledge(words: WordKnowledge[]) {
	return apiCall('/api/knowledge', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ words })
	});
}
