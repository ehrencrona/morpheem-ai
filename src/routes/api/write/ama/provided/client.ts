import { UnknownWordResponse } from '../../../word/unknown/+server';
import { PostSchema } from './+server';

export async function fetchProvidedWordsInAnswer(
	params: PostSchema
): Promise<UnknownWordResponse[]> {
	const res = await fetch(`/api/write/ama/provided`, {
		method: 'POST',
		body: JSON.stringify(params),
		headers: {
			'Content-Type': 'application/json'
		}
	});

	if (!res.ok) {
		throw new Error('Failed fetch provided words in answer');
	}

	return await res.json();
}
