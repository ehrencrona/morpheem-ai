import { redirectToLogin } from '$lib/redirectToLogin';
import { ServerLoad, json } from '@sveltejs/kit';
import {
	WritingFeedbackOpts,
	generateWritingFeedback,
	writingFeedbackOptsSchema
} from '../../../../../logic/generateWritingFeedback';

export type PostSchema = WritingFeedbackOpts;
const postSchema = writingFeedbackOptsSchema;

export const POST: ServerLoad = async ({ url, request, locals: { language, userId } }) => {
	const post = postSchema.parse(await request.json());

	if (!userId) {
		return redirectToLogin(url);
	}

	return json(await generateWritingFeedback(post, { language, userId }));
};
