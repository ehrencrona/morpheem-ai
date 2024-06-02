import { apiCall } from '../../../api-call';

export async function fetchMnemonic(
	wordId: number,
	generate: boolean = false
): Promise<string | undefined> {
	return (
		((await apiCall(`/api/word/${wordId}/mnemonic${generate ? `?generate` : ''}`, {
			method: 'POST'
		})) as string) || undefined
	);
}

export async function storeMnemonic(wordId: number, mnemonic: string): Promise<string> {
	return apiCall(`/api/word/${wordId}/mnemonic`, {
		method: 'PUT',
		body: JSON.stringify({ mnemonic })
	});
}
