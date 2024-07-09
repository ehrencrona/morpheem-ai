export function formatMinutes(minutes: number) {
	if (minutes < 60) {
		return `${Math.round(minutes)} minutes`;
	}

	const hours = minutes / 60;

	if (hours < 24) {
		return `${Math.round(hours)} hours`;
	}

	const days = hours / 24;

	if (days < 7) {
		return `${Math.round(days)} days`;
	}

	const weeks = days / 7;

	if (weeks < 4) {
		return `${Math.round(weeks)} weeks`;
	}

	const months = days / 30;

	if (months < 12) {
		return `${Math.round(months)} months`;
	}

	const years = months / 12;

	return `${Math.round(years)} years`;
}
