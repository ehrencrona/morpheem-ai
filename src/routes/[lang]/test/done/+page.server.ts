import { redirectToLogin } from '$lib/redirectToLogin';
import { ServerLoad, redirect } from '@sveltejs/kit';
import { KNOWLEDGE_TYPE_READ } from '../../../../db/knowledgeTypes';
import { calculateTestResult } from '../../../../logic/calculateTestResult';
import { updateUserSettings } from '../../../../db/userSettings';

export const load: ServerLoad = async ({ locals: { language, userId }, url }) => {
	if (!userId) {
		return redirectToLogin(url);
	}

	const { level } = await calculateTestResult({ userId, language, type: KNOWLEDGE_TYPE_READ });

	// this is a bit crude but it would be bad if the unit stayed set while we marked lots of words as known.
	await updateUserSettings({ unit: null }, userId, language);

	return redirect(302, `write?level=${level}`);
};
