export function formatMinutes(minutes: number) {
	if (minutes < 60) {
		return `${Math.round(minutes)} minutes`;
	}

	const hours = Math.round(minutes / 60);

	if (hours < 24) {
		return `${hours} hour` + (hours != 1 ? 's' : '');
	}

	const days = Math.round(hours / 24);

	if (days < 7) {
		return `${days} day` + (days != 1 ? 's' : '');
	}

	const weeks = Math.round(days / 7);

	if (weeks < 4) {
		return `${weeks} week` + (weeks != 1 ? 's' : '');
	}

	const months = Math.round(days / 30);

	if (months < 12) {
		return `${months} month` + (months != 1 ? 's' : '');
	}

	const years = Math.round(months / 12);

	return `${Math.round(years)} year` + (years != 1 ? 's' : '');
}
