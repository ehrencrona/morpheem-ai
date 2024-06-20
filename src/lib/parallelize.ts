export async function parallelize(
	promises: (() => Promise<any>)[],
	concurrency: number,
	printProgress = false
): Promise<void> {
	let at = 0;

	function next(): Promise<void> {
		if (printProgress && at % 100 === 0 && at > 0) {
			console.log(`${at}/${promises.length}...`);
		}

		if (at < promises.length) {
			const index = at++;

			return promises[index]().then(next);
		}

		return Promise.resolve();
	}

	await Promise.all(Array.from({ length: concurrency }, next));
}
