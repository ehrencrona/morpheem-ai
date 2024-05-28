import { apiCall } from '../../api-call';
import { PostSchema } from './+server';

export async function fetchAskMeAnything(params: PostSchema): Promise<string> {
	return apiCall(`/api/write/ama`, {
		method: 'POST',
		body: JSON.stringify(params),
		headers: {
			'Content-Type': 'application/json'
		}
	});
}
