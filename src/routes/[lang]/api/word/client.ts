import { apiCall } from '../api-call';
import { PostSchema, ResultSchema } from './+server';

export async function sendWords(lemmas: string[]): Promise<ResultSchema> {
	return apiCall(`/api/word`, {
		method: 'POST',
		body: JSON.stringify(lemmas satisfies PostSchema)
	});
}
