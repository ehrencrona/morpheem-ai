import { PostSchema } from './+server';

export async function storeWrittenSentence(params: PostSchema): Promise<void> {
	const res = await fetch(`/api/write`, {
		method: 'POST',
		body: JSON.stringify(params),
		headers: {
			'Content-Type': 'application/json'
		}
	});

	if (!res.ok) {
		throw new Error('Failed to get store written sentence');
	}

	return await res.json();
}
