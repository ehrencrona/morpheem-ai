import { apiCall } from '../../../api-call';
import type { ClausesResponse } from './+server';

export async function fetchClauses(sentenceId: number): Promise<ClausesResponse> {
	return apiCall(`/api/sentences/${sentenceId}/clauses`, {
		method: 'GET'
	});
}
