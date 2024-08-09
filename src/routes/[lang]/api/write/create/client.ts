import { UserExerciseWithSentence } from '../../../../../db/types';
import { apiCall } from '../../api-call';
import type { PostSchema } from './+server';

export async function sendGenerateTranslate(opts: PostSchema): Promise<UserExerciseWithSentence> {
	return apiCall(`/api/write/create`, {
		method: 'POST',
		body: JSON.stringify(opts)
	});
}
