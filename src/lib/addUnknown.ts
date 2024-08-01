import { UnknownWordResponse } from '../routes/[lang]/api/word/unknown/+server';

export function addUnknown(add: UnknownWordResponse, toUnknowns: UnknownWordResponse[]) {
	const res = toUnknowns.map((unknown) => (unknown.word === add.word ? add : unknown));

	if (res.every((unknown) => unknown.word !== add.word)) {
		res.push(add);
	}

	return res;
}
