export async function markSentenceSeen(sentenceId: number): Promise<void> {
	const res = await fetch(`/api/sentences/${sentenceId}`, {
		method: 'POST'
	});

	if (!res.ok) {
		throw new Error('Failed to mark sentence seen');
	}
}
