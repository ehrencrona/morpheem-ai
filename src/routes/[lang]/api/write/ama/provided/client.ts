import { apiCall } from '../../../api-call';
import { UnknownWordResponse } from '../../../word/unknown/+server';
import { PostSchema } from './+server';

export async function fetchProvidedWordsInAnswer(
	params: PostSchema
): Promise<UnknownWordResponse[]> {
	return apiCall(`/api/write/ama/provided`, {
		method: 'POST',
		body: JSON.stringify(params),
		headers: {
			'Content-Type': 'application/json'
		}
	});
}
