import { ServerLoad, redirect } from '@sveltejs/kit';
import { KNOWLEDGE_TYPE_CLOZE, KNOWLEDGE_TYPE_WRITE } from '../../../../../db/knowledgeTypes';
import { calculateTestResult } from '../../../../../logic/calculateTestResult';
import { redirectToLogin } from '$lib/redirectToLogin';

export const load: ServerLoad = async ({ locals: { language, userId }, url }) => {
	if (!userId) {
		return redirectToLogin(url);
	}

	await calculateTestResult({ userId, language, type: KNOWLEDGE_TYPE_CLOZE });

	return redirect(302, `../result`);
};
