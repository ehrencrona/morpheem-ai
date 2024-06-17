export function splitIntoDiff(a: string | undefined, b: string | undefined) {
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

	let suffix = [...a].findLastIndex((c, i) => c != b[i - a.length + b.length]);

	if (suffix == -1) {
		suffix = a.length;
	} else {
		suffix++;
	}

	return [a.slice(0, prefix), a.slice(prefix, suffix), a.slice(suffix)];
}
