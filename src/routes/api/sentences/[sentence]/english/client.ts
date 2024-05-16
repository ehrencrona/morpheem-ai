export async function fetchTranslation(sentenceId: number): Promise<string> {
	const res = await fetch(`/api/sentences/${sentenceId}/english`, {
		method: 'GET'
	});

	if (!res.ok) {
		throw new Error('Failed to fetch translation');
	}

	return (await res.json()) as string;
}
