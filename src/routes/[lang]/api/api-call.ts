export async function apiCall(path: string, options: RequestInit) {
	const lang = document.location.pathname.split('/')[1];

	const response = await fetch(`/${lang}${path}`, options);

	if (response.ok) {
		return response.json();
	} else {
		throw new Error(`While calling ${path}: ${await response.text()}`);
	}
}
