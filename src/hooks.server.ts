import { HandleServerError, json, type Handle } from '@sveltejs/kit';
import { lucia } from './db/lucia';
import { DUTCH, FRENCH, KOREAN, POLISH, RUSSIAN, SPANISH, SWEDISH } from './constants';
import { init, captureException } from '@sentry/browser';
import { cloneError } from '$lib/logError';

const isLoggingEnabled = import.meta.env.PROD;

if (isLoggingEnabled) {
	init({
		dsn: 'https://f962852f91c7442fb3e1f503735ca05f@app.glitchtip.com/7067',
		tracesSampleRate: 0.01
	});
}

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(lucia.sessionCookieName);

	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		event.locals.isAdmin = false;
	}

	let { session, user } = sessionId
		? await lucia.validateSession(sessionId)
		: { session: null, user: null };

	if (event.url.pathname.includes('/api') && !user) {
		return json(
			{
				error: 'Unauthorized'
			},
			{
				status: 401
			}
		);
	}

	if (session && session.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		// sveltekit types deviates from the de-facto standard
		// you can use 'as any' too
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}

	if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}

	event.locals.user = user;
	event.locals.userId = user?.num || null;
	event.locals.session = session;
	event.locals.isAdmin = user?.num == 4711;

	const languageCode = event.url.pathname.split('/')[1];

	const language = {
		pl: POLISH,
		fr: FRENCH,
		es: SPANISH,
		ko: KOREAN,
		nl: DUTCH,
		ru: RUSSIAN,
		sv: SWEDISH
	}[languageCode];

	event.locals.language = language; // || POLISH;

	let startTime = Date.now();

	const response = await resolve(event);

	console.log(
		`${new URL(event.request.url).pathname} ${response.status} ${user?.username || '-'} ${Date.now() - startTime}ms`
	);

	return response;
};

let lastThrottleTime = 0;
let logCount = 0;

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	const errorId = randomString();

	if (
		isLoggingEnabled &&
		(error as any).status != 404 &&
		(logCount < 4 || Date.now() - lastThrottleTime > 60000)
	) {
		lastThrottleTime = Date.now();
		logCount = 0;

		captureException(error, {
			extra: { event, errorId, status }
		});

		error = cloneError(error, `${message} (error ID: ${errorId})`);
	}

	console.error(error);

	return {
		message,
		errorId
	};
};

function randomString() {
	return Math.random().toString(36).substring(7);
}
