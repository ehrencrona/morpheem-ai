export async function fetchWordsByPrefix(prefix: string): Promise<string[]> {
	const res = await fetch(`/api/word/prefix/${encodeURIComponent(prefix)}`, {});

	if (!res.ok) {
		throw new Error('Failed to get words by prefix');
	}

	return await res.json();
}
