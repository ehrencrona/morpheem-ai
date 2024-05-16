export async function fetchHint(sentenceId: number): Promise<string> {
	const res = await fetch(`/api/sentences/${sentenceId}/hint`, {
		method: 'GET'
	});

	if (!res.ok) {
		throw new Error('Failed to generate sentence hint');
	}

	return (await res.json()) as string;
}
