import { ServerLoad, redirect } from '@sveltejs/kit';
import { KNOWLEDGE_TYPE_CLOZE, KNOWLEDGE_TYPE_WRITE } from '../../../../../db/knowledgeTypes';
import { calculateTestResult } from '../../../../../logic/calculateTestResult';

export const load: ServerLoad = async ({ locals: { language, userId } }) => {
	if (!userId) {
		return redirect(302, `/login`);
	}

	await calculateTestResult({ userId, language, type: KNOWLEDGE_TYPE_CLOZE });

	return redirect(302, `../result`);
};
