export function getRepetitionTime(): number {
	if (typeof localStorage === 'undefined') {
		return 0;
	}

	const str = localStorage.getItem('repetitionTime');

	return str == null ? 0 : Math.min(Math.max(parseInt(str), -2), 2);
}

export function setRepetitionTime(value: number): void {
	localStorage.setItem('repetitionTime', value.toString());
}

export function getPastDue(): number {
	if (typeof localStorage === 'undefined') {
		return 0;
	}

	const str = localStorage.getItem('pastDue');

	return str == null ? 0 : Math.min(Math.max(parseInt(str), -2), 2);
}

export function setPastDue(value: number): void {
	localStorage.setItem('pastDue', value.toString());
}

export function getReadPreference(): number {
	if (typeof localStorage === 'undefined') {
		return 0;
	}

	const str = localStorage.getItem('readPreference');

	return str == null ? 0 : Math.min(Math.max(parseInt(str), -2), 2);
}

export function setReadPreference(value: number): void {
	localStorage.setItem('readPreference', value.toString());
}

export function getClozePreference(): number {
	if (typeof localStorage === 'undefined') {
		return 0;
	}

	const str = localStorage.getItem('clozePreference');

	return str == null ? 0 : Math.min(Math.max(parseInt(str), -2), 2);
}

export function setClozePreference(value: number): void {
	localStorage.setItem('clozePreference', value.toString());
}