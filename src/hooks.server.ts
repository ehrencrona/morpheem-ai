import { json, type Handle } from '@sveltejs/kit';
import { lucia } from './db/lucia';
import { FRENCH, POLISH } from './constants';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(lucia.sessionCookieName);

	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
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

	const languageCode = event.url.pathname.split('/')[1];

	const language = { pl: POLISH, fr: FRENCH }[languageCode];

	event.locals.language = language || POLISH;

	let startTime = Date.now();

	const response = await resolve(event);

	console.log(
		`${new URL(event.request.url).pathname} ${response.status} ${user?.username || '-'} ${Date.now() - startTime}ms`
	);

	return response;
};
