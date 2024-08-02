export function dedup<T>(array: T[]) {
	return [...new Set(array)];
}
