import { getAggregateKnowledgeForUser, getEasiestUnstudiedWords } from '../db/knowledge';
import { WordType } from '../db/types';
import { getAllRelated } from '../db/wordRelations';
import { now, nt } from './isomorphic/knowledge';
import { Language } from './types';

export async function getAggregateKnowledge(
	userId: number,
	{ language, upToUnit }: { language: Language; upToUnit?: number }
) {
	let [knowledge, allRelated] = await Promise.all([
		getAggregateKnowledgeForUser({ userId, language, upToUnit }),
		getAllRelated(language)
	]);

	const easiestUnstudied = await getEasiestUnstudiedWords({
		userId,
		language,
		limit: 10,
		upToUnit
	});

	const lastTime = now() - 5;

	const allKnownWordIds = new Set(knowledge.map((k) => k.wordId));

	let relatedFound = 0;

	for (const wordId of allKnownWordIds) {
		const relateds = allRelated.get(wordId);

		if (relateds) {
			for (const { id: wordId, level, type: wordType, word } of relateds) {
				if (!allKnownWordIds.has(wordId)) {
					knowledge.push({
						alpha: 0.5,
						beta: 0.25,
						wordId,
						level,
						wordType,
						word: word,
						lastTime,
						source: 'related'
					});

					allKnownWordIds.add(wordId);

					relatedFound++;
				}
			}
		}
	}

	console.log(`Found ${relatedFound} related words for user ${userId}`);

	knowledge = knowledge.concat(
		easiestUnstudied.map(({ id, level, word, type }) => ({
			alpha: nt,
			beta: null,
			wordId: id,
			level,
			wordType: type ? (type as WordType) : undefined,
			lastTime,
			word,
			source: 'unstudied'
		}))
	);

	return knowledge;
}
