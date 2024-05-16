export async function fetchMnemonic(wordId: number): Promise<string> {
	const res = await fetch(`/api/word/${wordId}/mnemonic`, {
		method: 'GET'
	});

	if (!res.ok) {
		throw new Error('Failed to generate mnemonic');
	}

	return await res.json();
}
