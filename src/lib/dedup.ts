export function dedup(array: string[]) {
	return [...new Set(array)];
}
