export async function sendWordsKnown({ read, write }: { read: number; write: number }) {
	const res = await fetch('/api/knowledge/words-known', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ read, write })
	});

	if (!res.ok) {
		throw new Error('Failed to store words known.');
	}
}
