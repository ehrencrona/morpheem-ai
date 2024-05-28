import { apiCall } from '../../api-call';

export async function sendMinuteSpent() {
	await apiCall('/api/knowledge/minutes-spent', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({})
	});
}
