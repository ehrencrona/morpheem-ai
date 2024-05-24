export async function sendMinuteSpent() {
	const res = await fetch('/api/knowledge/minutes-spent', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({})
	});

	if (!res.ok) {
		throw new Error('Failed to store minute spent.');
	}
}
