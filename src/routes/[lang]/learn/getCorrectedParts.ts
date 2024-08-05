export function getCorrectedParts(sentence: string, corrected: string[]) {
	let parts: { part: string; isCorrected: boolean }[] = [];

	parts = [{ part: sentence, isCorrected: false }];

	corrected.forEach((correctedString) => {
		for (let i = parts.length - 1; i >= 0; i--) {
			const part = parts[i];

			let match = part.part.match(
				new RegExp(
					// match on word boundary
					`(?:^|[\\s\\p{P}])${correctedString.replace(/[\/\\^$*+?.()|[\]{}]/g, '\\$&')}(?:[\\s\\p{P}]|$)`,
					'u'
				)
			);

			if (!part.isCorrected && match != undefined) {
				let j = match[0].indexOf(correctedString);

				const index = match.index! + j;

				parts.splice(
					i,
					1,
					{ part: part.part.slice(0, index), isCorrected: false },
					{ part: correctedString, isCorrected: true },
					{
						part: part.part.slice(index + correctedString.length),
						isCorrected: false
					}
				);
			}
		}
	});

	return parts.filter((part) => part.part);
}
