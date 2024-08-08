import { captureException } from '@sentry/browser';
import { writable } from 'svelte/store';

export const errorStore = writable<any>(null);

let lastThrottleTime = 0;
let logCount = 0;

export function cloneError(e: any, message: string) {
	const clonedError = new Error(message);

	Object.assign(clonedError, e);

	clonedError.message = message;

	// Copy the stack property, which is non-enumerable by default
	clonedError.stack = e.stack;

	return clonedError;
}

export function logError(error: any, context?: string) {
	if (context) {
		error = cloneError(error, `${context}: ${error.message}`);
	}

	console.error(error);

	logCount++;

	let isWorthLogging =
		![
			'Failed to fetch',
			// these are logged on server
			'Server error',
			// this seems to be the audio player on safari
			'The operation is not supported.'
		].some((s) => error.message?.includes(s)) &&
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
