import { inventExampleSentences } from '../logic/inventExampleSentences';

async function invent() {
	const sentences = await inventExampleSentences('popełnić', undefined, 6);

	//	console.log(sentences);
}

invent();
