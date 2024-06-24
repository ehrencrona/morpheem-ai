import { captureException } from '@sentry/browser';
import { writable } from 'svelte/store';

export const errorStore = writable<any>(null);

let lastThrottleTime = 0;
let logCount = 0;

export function logError(error: any) {
	console.error(error);

	logCount++;

	let isWorthLogging =
		error.message != 'Failed to fetch' &&
		error.code != 'sentenceMissing' &&
		typeof document !== 'undefined' &&
		document.location.hostname !== 'localhost';

	if (isWorthLogging && (logCount < 4 || Date.now() - lastThrottleTime > 60000)) {
		lastThrottleTime = Date.now();
		logCount = 0;

		if (document.location.hostname != 'localhost') {
			captureException(error);
		}
	}

	errorStore.set(error);
}
