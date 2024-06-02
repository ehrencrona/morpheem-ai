import { apiCall } from '../api-call';
import { PostSchema } from './+server';
import * as DB from '../../../../db/types';

export async function storeWrittenSentence(params: PostSchema): Promise<DB.Word[]> {
	return apiCall(`/api/write`, {
		method: 'POST',
		body: JSON.stringify(params),
		headers: {
			'Content-Type': 'application/json'
		}
	});
}
