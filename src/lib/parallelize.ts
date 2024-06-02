export async function parallelize(
	promises: (() => Promise<any>)[],
	concurrency: number
): Promise<void> {
	let at = 0;

	function next(): Promise<void> {
		if (at < promises.length) {
			const index = at++;

			return promises[index]().then(next);
		}

		return Promise.resolve();
	}

	await Promise.all(Array.from({ length: concurrency }, next));
}
