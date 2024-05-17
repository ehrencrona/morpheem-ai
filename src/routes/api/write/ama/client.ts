import { PostSchema } from './+server';

export async function fetchAskMeAnything(params: PostSchema): Promise<string> {
	const res = await fetch(`/api/write/ama`, {
		method: 'POST',
		body: JSON.stringify(params),
		headers: {
			'Content-Type': 'application/json'
		}
	});

	if (!res.ok) {
		throw new Error('Failed to ask writing question');
	}

	return await res.json();
}
