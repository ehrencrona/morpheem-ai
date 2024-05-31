import { redirect } from '@sveltejs/kit';

export function redirectToLogin(url: URL) {
	return {
		status: 302,
		headers: {
			location: redirect(302, `/login?return_to=${encodeURIComponent(url.pathname)}`)
		}
	};
}
