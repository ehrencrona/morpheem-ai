import { generateCloze } from '../../../../../logic/generateCloze';
import { ExerciseKnowledge } from '../../../../../logic/types';
import { apiCall } from '../../api-call';
import type { PostSchema, PutSchema } from './+server';

export async function sendGenerateCloze(opts: PostSchema): ReturnType<typeof generateCloze> {
	return apiCall(`/api/cloze/create`, {
		method: 'POST',
		body: JSON.stringify(opts)
	});
}

export async function sendClozes(opts: PutSchema): Promise<ExerciseKnowledge[]> {
	return apiCall(`/api/cloze/create`, {
		method: 'PUT',
		body: JSON.stringify(opts)
	});
}
