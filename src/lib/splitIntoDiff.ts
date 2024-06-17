export function splitIntoDiff(a: string, b: string) {
	if (!a) {
		return ['', '', ''];
	}

	if (!b) {
		return ['', a, ''];
	}

	let prefix = [...a].findIndex((c, i) => c != b[i]);

	if (prefix == -1) {
		prefix = a.length;
	}

	let suffix = [...a].findLastIndex((c, i) => c != b[i]);

	if (suffix == -1) {
		suffix = a.length;
	}

	return [a.slice(0, prefix), a.slice(prefix, suffix + 1), a.slice(suffix + 1)];
}
