export function filterUndefineds<T>(arr: (T | undefined)[]): T[] {
	return arr.filter((x) => x !== undefined) as T[];
}
