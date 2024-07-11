import { redirect } from '@sveltejs/kit';

export function redirectToLogin(url: URL) {
	return redirect(302, `/signup?return_to=${encodeURIComponent(url.pathname)}`);
}
