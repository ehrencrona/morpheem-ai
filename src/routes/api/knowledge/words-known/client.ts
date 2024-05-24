export async function sendWordsKnown(wordsKnown: number) {
	const res = await fetch('/api/knowledge/words-known', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ wordsKnown })
	});

	if (!res.ok) {
		throw new Error('Failed to store words known.');
	}
}
