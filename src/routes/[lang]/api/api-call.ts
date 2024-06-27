import { page } from '$app/stores';
import { get } from 'svelte/store';
import { DUTCH, FRENCH, KOREAN, POLISH, RUSSIAN, SPANISH } from '../../../constants';
import { Language } from '../../../logic/types';

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

const langs: Record<string, Language> = {
	fr: FRENCH,
	pl: POLISH,
	es: SPANISH,
	ko: KOREAN,
	nl: DUTCH,
	ru: RUSSIAN
};

export function getLanguageOnClient() {
	const code = get(page).url.pathname.split('/')[1];

	const lang = langs[code];

	if (!lang) {
		throw new Error(`Unsupported language: ${code}`);
	}

	return lang;
}
