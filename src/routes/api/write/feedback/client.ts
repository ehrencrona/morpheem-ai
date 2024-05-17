import { generateWritingFeedback } from '../../../../ai/generateWritingFeedback';
import { PostSchema } from './+server';

export async function fetchWritingFeedback(
	params: PostSchema
): Promise<ReturnType<typeof generateWritingFeedback>> {
	const res = await fetch(`/api/write/feedback`, {
		method: 'POST',
		body: JSON.stringify(params),
		headers: {
			'Content-Type': 'application/json'
		}
	});

	if (!res.ok) {
		throw new Error('Failed to get writing feedback');
	}

	return await res.json();
}
