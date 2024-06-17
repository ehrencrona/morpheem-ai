import { redirectToLogin } from '$lib/redirectToLogin';
import { ServerLoad, json } from '@sveltejs/kit';
import {
	WritingFeedbackOpts,
	evaluateWrite,
	writingFeedbackOptsSchema
} from '../../../../../logic/evaluateWrite';

export type PostSchema = WritingFeedbackOpts;
const postSchema = writingFeedbackOptsSchema;

export const POST: ServerLoad = async ({ url, request, locals: { language, userId } }) => {
	const post = postSchema.parse(await request.json());

	if (!userId) {
		return redirectToLogin(url);
	}

	return json(await evaluateWrite(post, { language, userId }));
};
