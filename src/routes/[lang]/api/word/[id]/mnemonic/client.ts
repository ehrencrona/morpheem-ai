import { apiCall } from '../../../api-call';

export async function fetchMnemonic(wordId: number, generate: boolean = false): Promise<string> {
	return apiCall(`/api/word/${wordId}/mnemonic${generate ? `?generate` : ''}`, {
		method: 'POST'
	});
}

export async function storeMnemonic(wordId: number, mnemonic: string): Promise<string> {
	return apiCall(`/api/word/${wordId}/mnemonic`, {
		method: 'PUT',
		body: JSON.stringify({ mnemonic })
	});
}
