import { inventExampleSentences } from '../logic/inventExampleSentences';

async function invent() {
	const sentences = await inventExampleSentences('popełnić', undefined);

	//	console.log(sentences);
}

invent();
