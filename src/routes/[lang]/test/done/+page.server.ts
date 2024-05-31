import { redirectToLogin } from '$lib/redirectToLogin';
import { ServerLoad, redirect } from '@sveltejs/kit';
import { KNOWLEDGE_TYPE_READ } from '../../../../db/knowledgeTypes';
import { calculateTestResult } from '../../../../logic/calculateTestResult';

export const load: ServerLoad = async ({ locals: { language, userId }, url }) => {
	if (!userId) {
		return redirectToLogin(url);
	}

	const { level } = await calculateTestResult({ userId, language, type: KNOWLEDGE_TYPE_READ });

	return redirect(302, `write?level=${level}`);
};
