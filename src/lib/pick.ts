export function pick<T>(array: T[], count: number): T[] {
	const result = [];
	const length = array.length;
	const indices = new Set<number>();

	while (result.length < count) {
		const index = Math.floor(Math.random() * length);

		if (indices.has(index)) {
			continue;
		}

		indices.add(index);
		result.push(array[index]);
	}

	return result;
}
