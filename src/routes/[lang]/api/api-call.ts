import { page } from '$app/stores';
import { get } from 'svelte/store';
import { FRENCH, KOREAN, POLISH, SPANISH } from '../../../constants';

export async function apiCall(path: string, options: RequestInit) {
	const lang = getLanguageOnClient().code;

	const response = await fetch(`/${lang}${path}`, options);

	if (response.ok) {
		try {
			return await response.json();
		} catch (e) {
			throw new Error(`While calling ${path}: ${e}`);
		}
	} else {
		let message = await response.text();

		if (message.includes('<body')) {
			message = `status ${response.status}`;
		}

		throw new Error(`While calling ${path}: ${message}`);
	}
}

export function getLanguageOnClient() {
	const code = get(page).url.pathname.split('/')[1];

	if (code == 'fr') {
		return FRENCH;
	} else if (code == 'pl') {
		return POLISH;
	} else if (code == 'es') {
		return SPANISH;
	} else if (code == 'ko') {
		return KOREAN;
	} else {
		throw new Error(`Unsupported language: ${code}`);
	}
}
