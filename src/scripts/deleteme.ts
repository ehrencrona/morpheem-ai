import { generateWritingFeedback } from '../logic/generateWritingFeedback';
import { POLISH } from '../constants';

async function boo() {
	const feedback = await generateWritingFeedback(
		{
			exercise: 'write',
			entered: `Trzeba myć zęb każdego dnia.`,
			word: `ząb`
			//`Film, który dzisiaj oglądałeś, widzil cię nastrajać refleksji nad własnie życiem.`,
		},
		{ language: POLISH, userId: 4711 }
	);

	console.log(JSON.stringify(feedback, null, 2));
}

boo();
