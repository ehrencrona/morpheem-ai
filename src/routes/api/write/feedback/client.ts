import type { FeedbackResponse, PostSchema } from './+server';

export async function fetchWritingFeedback(params: PostSchema): Promise<FeedbackResponse> {
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
