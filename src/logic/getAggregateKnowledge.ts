import { getAggregateKnowledgeForUser, getEasiestUnstudiedWords } from '../db/knowledge';
import { AggKnowledgeForUser, Word, WordType } from '../db/types';
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

	knowledge = addRelatedKnowledge(knowledge, allRelated, userId, upToUnit);

	const lastTime = now() - 5;

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

function addRelatedKnowledge(
	knowledge: AggKnowledgeForUser[],
	allRelated: Map<number, Word[]>,
	userId: number,
	upToUnit?: number
) {
	const lastTime = now() - 5;
	const allKnownWordIds = new Map<number, number>(knowledge.map((k) => [k.wordId, k.alpha]));

	let relatedFound = 0;

	for (const [wordId, alpha] of allKnownWordIds.entries()) {
		const relateds = allRelated.get(wordId);

		if (relateds) {
			for (const { id: wordId, level, type: wordType, word, unit } of relateds) {
				if (!allKnownWordIds.has(wordId) && (upToUnit == null || (unit && unit <= upToUnit))) {
					const wordKnowledge: AggKnowledgeForUser = {
						alpha: 0.5 * alpha,
						beta: null,
						wordId,
						level,
						wordType,
						word: word,
						lastTime,
						source: 'related'
					};

					knowledge.push(wordKnowledge);

					allKnownWordIds.set(wordId, wordKnowledge.alpha);

					relatedFound++;
				}
			}
		}
	}

	console.log(`Found ${relatedFound} related words for user ${userId}`);

	return knowledge;
}
