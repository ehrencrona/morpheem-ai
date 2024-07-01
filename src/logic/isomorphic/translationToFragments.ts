import { Clause } from '../../ai/splitIntoClauses';
import { isSeparator, toWordsWithSeparators } from '../toWords';

export interface Fragment {
	fragment: string;
	clauses: Clause[];
}

export function translationToFragments(englishSentence: string, clauses: Clause[]): Fragment[] {
	const words = toWordsWithSeparators(englishSentence, { code: 'en' });

	let fragments: Fragment[] = [];

	let atWord = 0;

	while (atWord < words.length) {
		const wordString = words[atWord];

		const fragmentClauses = clauses.filter((clause) => clause.english.includes(wordString));

		if (!isSeparator(wordString) && fragmentClauses.length) {
			let fragment: Fragment = {
				fragment: wordString,
				clauses: fragmentClauses
			};
			let didFind = false;

			for (let fragmentLength = 1; fragmentLength < words.length - atWord; fragmentLength++) {
				let fragmentString = fragment.fragment + words[atWord + fragmentLength];

				const fragmentClauses = clauses.filter((clause) => clause.english.includes(fragmentString));

				if (fragmentClauses.length == 0) {
					fragments.push(fragment);
					atWord += fragmentLength;

					didFind = true;
					break;
				} else {
					fragment = {
						fragment: fragmentString,
						clauses: fragmentClauses
					};
				}
			}

			if (!didFind) {
				fragments.push(fragment);

				atWord = words.length;
			}
		} else {
			fragments.push({ fragment: wordString, clauses: [] });

			atWord++;
		}
	}

	for (let at = fragments.length - 1; at >= 1; at--) {
		if (fragments[at].clauses.length == 0 && fragments[at - 1].clauses.length == 0) {
			fragments[at - 1] = {
				fragment: fragments[at - 1].fragment + fragments[at].fragment,
				clauses: []
			};

			fragments.splice(at, 1);
		}
	}

	return fragments;
}
