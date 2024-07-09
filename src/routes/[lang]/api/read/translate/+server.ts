import { ServerLoad, error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { translateSentences } from '../../../../../ai/translate';

const postSchema = z.object({
	text: z.string()
});

export const POST: ServerLoad = async ({ request, locals: { language, userId } }) => {
	if (!userId) {
		return error(401, 'Unauthorized');
	}

	const { text } = postSchema.parse(await request.json());

	const translation = await translateSentences([text], {
		language,
		literalTranslation: false
	});

	return json({
		translation: translation.translations.join(' '),
		transliteration: translation.transliterations?.join(' ')
	});
};
