export function zip<A, B>(a: A[], b: B[]): [A, B][] {
	if (a.length != b.length) {
		throw new Error(`Cannot zip arrays of different lengths: ${a.length} and ${b.length}`);
	}

	return a.map((a, i) => [a, b[i]]);
}

export function unzip<A, B>(ab: [A, B][]): [A[], B[]] {
	return ab.reduce(
		(acc, [a, b]) => {
			acc[0].push(a);
			acc[1].push(b);
			return acc;
		},
		[[], []] as [A[], B[]]
	);
}
