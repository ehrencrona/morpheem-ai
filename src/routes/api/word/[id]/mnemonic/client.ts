export async function fetchMnemonic(wordId: number, generate: boolean = false): Promise<string> {
	const res = await fetch(`/api/word/${wordId}/mnemonic${generate ? `?generate` : ''}`, {
		method: 'POST'
	});

	if (!res.ok) {
		throw new Error('Failed to generate mnemonic');
	}

	return await res.json();
}

export async function storeMnemonic(wordId: number, mnemonic: string): Promise<string> {
	const res = await fetch(`/api/word/${wordId}/mnemonic`, {
		method: 'PUT',
		body: JSON.stringify({ mnemonic })
	});

	if (!res.ok) {
		throw new Error('Failed to store mnemonic');
	}

	return await res.json();
}
