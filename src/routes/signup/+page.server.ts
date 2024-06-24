import { Actions, fail, redirect } from '@sveltejs/kit';
import { generateIdFromEntropySize } from 'lucia';
import { LegacyScrypt } from 'lucia';
import { db } from '../../db/client';
import { lucia } from '../../db/lucia';
import {
	INVALID_PASSWORD,
	INVALID_USERNAME,
	isPasswordValid,
	isUsernameValid
} from '../login/validation';

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

		if (!isPasswordValid(password)) {
			return fail(400, {
				message: INVALID_PASSWORD
			});
		}

		const userId = generateIdFromEntropySize(10); // 16 characters long
		const passwordHash = await new LegacyScrypt().hash(password);

		if (
			await db
				.selectFrom('auth_user')
				.selectAll()
				.where('username', '=', username)
				.executeTakeFirst()
		) {
			return fail(400, {
				message: 'Username already exists'
			});
		}

		await db
			.insertInto('auth_user')
			.values({
				id: userId,
				username: username,
				password_hash: passwordHash
			})
			.execute();

		console.log(`User ${username} signed up.`);

		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		redirect(302, '/');
	}
};
