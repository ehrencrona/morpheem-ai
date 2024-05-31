import { redirect } from '@sveltejs/kit';

export function redirectToLogin(url: URL) {
	return redirect(302, `/login?return_to=${encodeURIComponent(url.pathname)}`);
}
