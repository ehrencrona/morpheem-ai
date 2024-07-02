import { fail, redirect } from '@sveltejs/kit';

import type { Actions } from './$types';
import { db } from '../../db/client';
import { lucia } from '../../db/lucia';
import { LegacyScrypt } from 'lucia';
import { INVALID_PASSWORD, INVALID_USERNAME, isPasswordValid, isUsernameValid } from './validation';

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		let username = formData.get('username');
		const password = formData.get('password');

		if (!isUsernameValid(username)) {
			return fail(400, {
				username,
				message: INVALID_USERNAME
			});
		}

		username = username!.toString().toLowerCase();

		if (!isPasswordValid(password) || !password) {
			return fail(400, {
				message: INVALID_PASSWORD
			});
		}

		const existingUser = await db
			.selectFrom('auth_user')
			.selectAll()
			.where('username', '=', username.toLowerCase())
			.executeTakeFirst();

		if (!existingUser) {
			// NOTE:
			// Returning immediately allows malicious actors to figure out valid usernames from response times,
			// allowing them to only focus on guessing passwords in brute-force attacks.
			// As a preventive measure, you may want to hash passwords even for invalid usernames.
			// However, valid usernames can be already be revealed with the signup page among other methods.
			// It will also be much more resource intensive.
			// Since protecting against this is non-trivial,
			// it is crucial your implementation is protected against brute-force attacks with login throttling etc.
			// If usernames are public, you may outright tell the user that the username is invalid.
			return fail(400, {
				username,
				message: 'Incorrect username or password'
			});
		}

		const validPassword = await new LegacyScrypt().verify(
			existingUser.password_hash,
			password as string
		);

		if (!validPassword) {
			console.warn(`User ${username} failed to log in.`);

			return fail(400, {
				username,
				message: 'Incorrect username or password'
			});
		}

		console.log(`User ${username} logged in.`);

		const session = await lucia.createSession(existingUser.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		const returnTo = event.url.searchParams.get('return_to') || '/';

		redirect(302, returnTo);
	}
};
