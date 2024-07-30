import { page } from '$app/stores';
import { get } from 'svelte/store';
import { DUTCH, FRENCH, KOREAN, POLISH, RUSSIAN, SPANISH, SWEDISH } from '../../../constants';
import type { Language, LanguageCode } from '../../../logic/types';
import { error } from '@sveltejs/kit';

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

const langs: Record<LanguageCode, Language> = {
	fr: FRENCH,
	pl: POLISH,
	es: SPANISH,
	ko: KOREAN,
	nl: DUTCH,
	ru: RUSSIAN,
	sv: SWEDISH
};

export function getLanguageOnClient() {
	const code = get(page).url.pathname.split('/')[1];

	const lang = langs[code as LanguageCode];

	if (!lang) {
		throw error(404, `Unsupported language: ${code}`);
	}

	return lang;
}
