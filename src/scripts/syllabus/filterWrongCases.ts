import { toBatches } from '$lib/batch';
import { findTenses } from '../../ai/findTenses';
import { SPANISH } from '../../constants';
import { getSentences } from '../../db/sentences';

const language = SPANISH;
const unit = 2;

const sentences = await getSentences(language, unit);

for (const batch of toBatches(sentences, 30)) {
	const tenses = (await findTenses(batch, language)).tenses;

	tenses
		.filter((tense) => tense.tenses.some((t) => t != 'present' && t != 'preterite'))
		.map(({ id, tenses }) => {
			console.log(
				`Sentence ${id} "${sentences.find((s) => s.id == id)?.sentence}" has tenses ${tenses.join(', ')}`
			);
		});
}
