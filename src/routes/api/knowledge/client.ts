import type { getAggregateKnowledgeForUser } from '../../../db/knowledge';
import type { WordKnowledge } from '../../../logic/types';

export async function fetchAggregateKnowledge(): ReturnType<typeof getAggregateKnowledgeForUser> {
	const res = await fetch('/api/knowledge');

	if (!res.ok) {
		throw new Error('Failed to load knowledge');
	}

	return await res.json();
}

export async function sendKnowledge(words: WordKnowledge[]) {
	return fetch('/api/knowledge', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(words)
	});
}
