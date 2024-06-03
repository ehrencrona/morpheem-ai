export function getRepetitionTime(): number {
	const str = localStorage.getItem('repetitionTime');

	return str == null ? 0 : Math.min(Math.max(parseInt(str), -2), 2);
}

export function setRepetitionTime(value: number): void {
	localStorage.setItem('repetitionTime', value.toString());
}

export function getNewWordValue(): number {
	const str = localStorage.getItem('newWordValue');

	return str == null ? 0 : Math.min(Math.max(parseInt(str), -2), 2);
}

export function setNewWordValue(value: number): void {
	localStorage.setItem('newWordValue', value.toString());
}
