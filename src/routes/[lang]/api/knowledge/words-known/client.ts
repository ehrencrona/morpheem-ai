import { apiCall } from '../../api-call';

export async function sendWordsKnown({ read, write }: { read: number; write: number }) {
	return apiCall('/api/knowledge/words-known', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ read, write })
	});
}
