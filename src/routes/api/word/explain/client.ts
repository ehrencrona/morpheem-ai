export async function explainWord(word: string): Promise<string[]> {
	const res = await fetch(`/api/word/explain`, {
		method: 'POST',
		body: JSON.stringify({ word })
	});

	if (!res.ok) {
		throw new Error('Failed to explain word');
	}

	return await res.json();
}
