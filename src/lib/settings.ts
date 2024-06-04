export function getRepetitionTime(): number {
	const str = localStorage.getItem('repetitionTime');

	return str == null ? 0 : Math.min(Math.max(parseInt(str), -2), 2);
}

export function setRepetitionTime(value: number): void {
	localStorage.setItem('repetitionTime', value.toString());
}

export function getPastDue(): number {
	const str = localStorage.getItem('pastDue');

	return str == null ? 0 : Math.min(Math.max(parseInt(str), -2), 2);
}

export function setPastDue(value: number): void {
	localStorage.setItem('pastDue', value.toString());
}
