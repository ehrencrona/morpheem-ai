import { z } from 'zod';
import { Sentence, readFromFile, saveToFile, units } from './syllabus';
import { askForJson } from '../../ai/askForJson';
import { parallelize } from '$lib/parallelize';
import { shuffle } from 'simple-statistics';
import { toBatches } from '$lib/batch';
import { ask } from '../../ai/ask';

const missingByUnit = [
	[
		// { word: 'ja', missing: 3 },
		// { word: 'ty', missing: 3 },
		// { word: 'ono', missing: 3 }
	],
	[
		// { word: 'proszę', missing: 10 },
		// { word: 'nauczyciel', missing: 3 },
		// { word: 'kucharz', missing: 1 },
		// { word: 'przyjaciel', missing: 2 }
	],
	[
		// { word: 'na', missing: 6 },
		// { word: 'pisać', missing: 8 },
		// { word: 'kolacja', missing: 3 },
		// { word: 'owoc', missing: 10 },
		// { word: 'przez', missing: 1 },
		// { word: 'prosić', missing: 10 },
		// { word: 'iść', missing: 10 },
		// { word: 'twój', missing: 1 },
		// { word: 'imię', missing: 10 }
	],
	[
		{ word: 'korzystać', missing: 10 },
		{ word: 'z', missing: 8 },
		{ word: 'nigdy', missing: 10 },
		{ word: 'znaleźć', missing: 10 },
		{ word: 'trochę', missing: 7 },
		{ word: 'wiele', missing: 10 },
		{ word: 'kilka', missing: 10 },
		{ word: 'dużo', missing: 10 },
		{ word: 'więcej', missing: 8 },
		{ word: 'mało', missing: 10 },
		{ word: 'szklanka', missing: 10 },
		{ word: 'butelka', missing: 10 },
		{ word: 'paczka', missing: 10 },
		{ word: 'chcieć', missing: 3 },
		{ word: 'unikać', missing: 5 },
		{ word: 'bez', missing: 10 },
		{ word: 'do', missing: 7 },
		{ word: 'od', missing: 10 },
		{ word: 'dla', missing: 10 },
		{ word: 'wino', missing: 10 },
		{ word: 'sok', missing: 10 },
		{ word: 'czas', missing: 1 },
		{ word: 'podczas', missing: 10 },
		{ word: 'koncert', missing: 10 }
	],
	[
		{ word: 'przy', missing: 10 },
		{ word: 'o', missing: 6 },
		{ word: 'pokój', missing: 3 },
		{ word: 'miejsce', missing: 7 },
		{ word: 'mieszkać', missing: 8 },
		{ word: 'leżeć', missing: 10 },
		{ word: 'rozmawiać', missing: 9 },
		{ word: 'biurko', missing: 6 },
		{ word: 'firma', missing: 5 },
		{ word: 'łóżko', missing: 8 },
		{ word: 'kuchnia', missing: 7 },
		{ word: 'salon', missing: 8 },
		{ word: 'park', missing: 9 },
		{ word: 'ulica', missing: 10 },
		{ word: 'restauracja', missing: 9 },
		{ word: 'sklep', missing: 7 },
		{ word: 'biblioteka', missing: 5 },
		{ word: 'przed', missing: 10 },
		{ word: 'nad', missing: 10 },
		{ word: 'sądzić', missing: 10 },
		{ word: 'myśleć', missing: 9 },
		{ word: 'mówić', missing: 9 },
		{ word: 'internet', missing: 10 }
	],
	[
		{ word: 'za', missing: 9 },
		{ word: 'myć', missing: 10 },
		{ word: 'ubierać', missing: 10 },
		{ word: 'podobać', missing: 10 },
		{ word: 'uczyć', missing: 7 },
		{ word: 'bawić', missing: 4 },
		{ word: 'cieszyć', missing: 7 },
		{ word: 'interesować', missing: 5 },
		{ word: 'zajmować', missing: 4 },
		{ word: 'spotykać', missing: 9 },
		{ word: 'łazienka', missing: 9 },
		{ word: 'ubranie', missing: 6 },
		{ word: 'lekcja', missing: 10 },
		{ word: 'zabawa', missing: 8 },
		{ word: 'hobby', missing: 8 },
		{ word: 'zadanie', missing: 10 },
		{ word: 'spotkać', missing: 10 },
		{ word: 'spotkanie', missing: 9 },
		{ word: 'projekt', missing: 7 },
		{ word: 'siebie', missing: 9 },
		{ word: 'aplikacja', missing: 10 }
	],
	[
		{ word: 'przeczytać', missing: 7 },
		{ word: 'napisać', missing: 9 },
		{ word: 'zjeść', missing: 5 },
		{ word: 'wypić', missing: 7 },
		{ word: 'obejrzeć', missing: 9 },
		{ word: 'kupić', missing: 7 },
		{ word: 'robić', missing: 8 },
		{ word: 'zrobić', missing: 10 },
		{ word: 'pójść', missing: 7 },
		{ word: 'powiedzieć', missing: 10 },
		{ word: 'pomyśleć', missing: 10 },
		{ word: 'zrozumieć', missing: 9 },
		{ word: 'dostać', missing: 10 },
		{ word: 'popracować', missing: 9 },
		{ word: 'gazeta', missing: 7 },
		{ word: 'list', missing: 9 },
		{ word: 'obiad', missing: 9 },
		{ word: 'kawa', missing: 4 },
		{ word: 'śniadanie', missing: 5 },
		{ word: 'po', missing: 10 }
	],
	[
		{ word: 'ptak', missing: 10 },
		{ word: 'kwiat', missing: 8 },
		{ word: 'chodzić', missing: 8 },
		{ word: 'biegać', missing: 8 },
		{ word: 'latać', missing: 10 },
		{ word: 'śpiewać', missing: 9 },
		{ word: 'tańczyć', missing: 7 },
		{ word: 'grać', missing: 10 },
		{ word: 'każdy', missing: 9 },
		{ word: 'cały', missing: 10 },
		{ word: 'spacer', missing: 7 },
		{ word: 'produkt', missing: 7 },
		{ word: 'my', missing: 9 },
		{ word: 'ulubiony', missing: 9 },
		{ word: 'las', missing: 9 },
		{ word: 'rodzina', missing: 8 },
		{ word: 'krzesło', missing: 1 },
		{ word: 'drzwi', missing: 9 }
	],
	[
		{ word: 'program', missing: 3 },
		{ word: 'kolorowy', missing: 8 },
		{ word: 'zbierać', missing: 6 },
		{ word: 'drogi', missing: 6 },
		{ word: 'mama', missing: 1 },
		{ word: 'nosić', missing: 10 },
		{ word: 'móc', missing: 7 },
		{ word: 'trudny', missing: 3 },
		{ word: 'warzywo', missing: 5 }
	],
	[
		{ word: 'już', missing: 3 },
		{ word: 'przynieść', missing: 4 },
		{ word: 'sprawdzić', missing: 8 },
		{ word: 'przyjść', missing: 2 },
		{ word: 'rozumieć', missing: 8 },
		{ word: 'pracownik', missing: 3 },
		{ word: 'klucz', missing: 5 },
		{ word: 'obraz', missing: 1 },
		{ word: 'wy', missing: 6 },
		{ word: 'pytać', missing: 6 },
		{ word: 'zauważyć', missing: 7 },
		{ word: 'słyszeć', missing: 9 }
	],
	[
		{ word: 'musieć', missing: 4 },
		{ word: 'ważny', missing: 4 },
		{ word: 'planować', missing: 8 },
		{ word: 'historia', missing: 3 },
		{ word: 'ostatni', missing: 10 },
		{ word: 'dbać', missing: 5 },
		{ word: 'zdrowie', missing: 5 },
		{ word: 'zamiast', missing: 8 },
		{ word: 'otworzyć', missing: 9 },
		{ word: 'długi', missing: 4 },
		{ word: 'jutro', missing: 9 },
		{ word: 'organizować', missing: 9 },
		{ word: 'impreza', missing: 7 },
		{ word: 'urodzinowy', missing: 9 },
		{ word: 'pieszo', missing: 8 },
		{ word: 'odpoczynek', missing: 9 },
		{ word: 'ostatnio', missing: 7 }
	],
	[
		{ word: 'prowadzić', missing: 1 },
		{ word: 'zaczynać', missing: 6 },
		{ word: 'który', missing: 3 },
		{ word: 'przyszłość', missing: 1 },
		{ word: 'sobota', missing: 5 },
		{ word: 'jako', missing: 6 },
		{ word: 'raport', missing: 2 },
		{ word: 'muzyka', missing: 5 },
		{ word: 'mecz', missing: 5 }
	],
	[
		{ word: 'potrzebny', missing: 2 },
		{ word: 'opowiadać', missing: 4 },
		{ word: 'pożyczyć', missing: 5 },
		{ word: 'wolno', missing: 7 },
		{ word: 'zimno', missing: 6 },
		{ word: 'klient', missing: 4 },
		{ word: 'ufać', missing: 9 },
		{ word: 'zabawka', missing: 1 },
		{ word: 'uczeń', missing: 6 },
		{ word: 'bajka', missing: 2 },
		{ word: 'podawać', missing: 8 }
	],
	[
		{ word: 'żaden', missing: 3 },
		{ word: 'ani', missing: 1 },
		{ word: 'napój', missing: 6 },
		{ word: 'obcy', missing: 2 },
		{ word: 'interesujący', missing: 1 },
		{ word: 'tydzień', missing: 5 },
		{ word: 'okulary', missing: 5 },
		{ word: 'rok', missing: 8 },
		{ word: 'dzień', missing: 2 },
		{ word: 'oraz', missing: 6 }
	],
	[
		{ word: 'plaża', missing: 2 },
		{ word: 'wasz', missing: 2 },
		{ word: 'kiedyś', missing: 9 },
		{ word: 'niektóry', missing: 5 },
		{ word: 'sprzedawać', missing: 7 },
		{ word: 'odpoczywać', missing: 3 },
		{ word: 'jezioro', missing: 5 },
		{ word: 'muzeum', missing: 2 },
		{ word: 'lotnisko', missing: 7 }
	]
];

async function askForUnit(
	word: string,
	count: number,
	// 1 is first unit
	unit: number
): Promise<string[]> {
	const vocabulary: string[] = [];

	for (let i = 0; i < unit; i++) {
		vocabulary.push(...units[i].words);
	}

	const res = await ask({
		messages: [
			{
				role: 'user',
				content: `
Write ${count} sentences using word "${word}" and only the following vocabulary and only the following grammatical forms: ${units
					.slice(0, unit)
					.map((u) => u.name)
					.join(', ')}.

Start by combining individual words into fragments that might make sense e.g. "mała torba" and then make longer fragments / sentences using those by attaching more words e.g. "moja mała torba".
Print one sentence on each line and nothing else.

Vocabulary: ${shuffle(vocabulary).join(', ')}
`
			}
		],
		model: 'gpt-4o',
		temperature: 1
	});

	return res.split('\n').filter((line) => line.trim().length > 0);
}

function pick(arr: any[], count: number) {
	const result = [];
	for (let i = 0; i < count; i++) {
		result.push(arr[Math.floor(Math.random() * arr.length)]);
	}
	return result;
}

function dedup(arr: string[]) {
	return arr.filter((item, index) => arr.indexOf(item) === index);
}

let sentences = readFromFile();

async function main() {
	parallelize(
		units.slice(2).map((unit) => async () => {
			const missing = missingByUnit[unit.number - 1];

			for (const word of missing) {
				if (word.missing >= 5) {
					const s = await askForUnit(word.word, word.missing, unit.number);

					sentences.push(...s.map((sentence) => ({ sentence, units: [] })));
				}
			}

			saveToFile(sentences);
		}),
		1
	);
}

main();
