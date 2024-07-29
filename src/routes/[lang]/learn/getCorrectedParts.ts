export function getCorrectedParts(sentence: string, corrected: string[]) {
	let parts: { part: string; isCorrected: boolean }[] = [];

	parts = [{ part: sentence, isCorrected: false }];

	corrected.forEach((correctedString) => {
		for (let i = parts.length - 1; i >= 0; i--) {
			const part = parts[i];

			let index = part.part.match(
				new RegExp(
					// match on word boundary
					`\\b${correctedString.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`
				)
			)?.index;

			if (index == undefined) {
				index = part.part.indexOf(correctedString);

				if (index < 0) {
					index = undefined;
				}
			}

			if (!part.isCorrected && index != undefined) {
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
