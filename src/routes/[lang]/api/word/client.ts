import { apiCall } from '../api-call';
import * as DB from '../../../../db/types';

export async function fetchMultipleWordsByIds(wordIds: number[]): Promise<DB.Word[]> {
	return apiCall(`/api/word`, {
		method: 'POST',
		body: JSON.stringify(wordIds)
	});
}
