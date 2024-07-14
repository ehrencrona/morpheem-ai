export function getCorrectedParts(sentence: string, corrected: string[]) {
	let parts: { part: string; isCorrected: boolean }[] = [];

	parts = [{ part: sentence, isCorrected: false }];

	corrected.forEach((correctedString) => {
		for (let i = parts.length - 1; i >= 0; i--) {
			const part = parts[i];

			if (!part.isCorrected && part.part.indexOf(correctedString) > -1) {
				parts.splice(
					i,
					1,
					{ part: part.part.slice(0, part.part.indexOf(correctedString)), isCorrected: false },
					{ part: correctedString, isCorrected: true },
					{
						part: part.part.slice(part.part.indexOf(correctedString) + correctedString.length),
						isCorrected: false
					}
				);
			}
		}
	});

	return parts.filter((part) => part.part);
}
