import { page } from '$app/stores';
import { get } from 'svelte/store';
import { FRENCH, POLISH } from '../../../constants';

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
		throw new Error(`While calling ${path}: ${await response.text()}`);
	}
}

export function getLanguageOnClient() {
	const code = get(page).url.pathname.split('/')[1];

	if (code == 'fr') {
		return FRENCH;
	} else if (code == 'pl') {
		return POLISH;
	} else {
		throw new Error(`Unsupported language: ${code}`);
	}
}
