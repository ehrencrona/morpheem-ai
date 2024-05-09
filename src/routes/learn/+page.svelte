<script lang="ts">
	import { onMount } from 'svelte';
	import type * as DB from '../../db/types';
	import { getNextSentence, getNextWords } from '../../logic/isomorphic/getNext';
	import type { AggKnowledgeForUser } from '../../logic/types';
	import { userId } from '../../logic/user';
	import { fetchAggregateKnowledge, sendKnowledge } from '../api/knowledge/client';
	import { markSentenceSeen } from '../api/sentences/[sentence]/client';
	import {
		addSentencesForWord,
		fetchSentencesWithWord
	} from '../api/sentences/withword/[word]/client';
	import { explainWord } from '../api/word/explain/client';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { lookupUnknownWord } from '../api/word/unknown/client';
	import Sentence from './Sentence.svelte';
	import { CodedError } from '../../CodedError';

	let knowledge: AggKnowledgeForUser[] = [];

	let current:
		| {
				wordId: number;
				sentence: DB.Sentence;
				words: DB.Word[];
				revealed: (UnknownWordResponse & { explanation?: string[] })[];
		  }
		| undefined;

	async function init() {
		knowledge = await fetchAggregateKnowledge();

		console.log(`Loaded ${knowledge.length} knowledge entries`);

		showNextSentence();
	}

	let nextPromise: ReturnType<typeof calculateNextSentence>;
	let isCalculatingNext = false;

	async function calculateNextSentence(wordIds: number[] = [], excludeWordId?: number) {
		if (!wordIds.length) {
			wordIds = getNextWords(knowledge).filter((id) => id !== excludeWordId);
		}

		const wordId = wordIds[0];

		try {
			let sentences = await fetchSentencesWithWord(wordId);
			let nextSentence = getNextSentence(sentences, knowledge, wordId);

			if (!nextSentence || nextSentence.score < 0.9) {
				sentences = sentences.concat(await addSentencesForWord(wordId));

				console.log(
					`Added ${sentences.length} sentences for word ${wordId}: ${sentences.map((s) => s.sentence) + '\n'}`
				);

				nextSentence = getNextSentence(sentences, knowledge, wordId);

				if (!nextSentence) {
					console.error(`No sentences found for word ${wordId}`);

					return calculateNextSentence(wordIds.slice(1), wordId);
				}
			}

			const { sentence, score } = nextSentence;

			return {
				sentence,
				wordId,
				getNextPromise: () => calculateNextSentence(wordIds.slice(1), wordId)
			};
		} catch (e: any) {
			if (e instanceof CodedError && e.code == 'wrongLemma') {
				knowledge = knowledge.filter((k) => wordId != k.wordId);
			} else {
				error = e.message;
			}

			return calculateNextSentence(wordIds.slice(1), wordId);
		}
	}

	async function showNextSentence() {
		isCalculatingNext = true;

		try {
			const {
				sentence,
				wordId,
				getNextPromise: getNext
			} = await (nextPromise || calculateNextSentence());

			nextPromise = getNext();

			markSentenceSeen(sentence.id).catch(console.error);

			current = {
				wordId: wordId,
				sentence: sentence,
				words: sentence.words,
				revealed: []
			};
			error = undefined;

			console.log({ current });
		} finally {
			isCalculatingNext = false;
		}
	}

	onMount(init);

	async function onExplain(lemma: string) {
		if (!current) {
			throw new Error('Invalid state');
		}

		const explanation = await explainWord(lemma);

		current.revealed = current.revealed.map((r) => {
			if (r.word === lemma) {
				r.explanation = explanation;
			}

			return r;
		});
	}

	async function onUnknown(word: string) {
		if (!current) {
			throw new Error('Invalid state');
		}

		const unknownWord = await lookupUnknownWord(word, current.sentence.id);

		current.revealed = [...current.revealed, unknownWord];
	}

	let error: string | undefined = undefined;

	async function store() {
		if (!current) {
			throw new Error('Invalid state');
		}

		try {
			const sentenceId = current.sentence.id;

			await sendKnowledge(
				current.words
					.filter((word) => !current!.revealed.find(({ id }) => id === word.id))
					.map((word) => ({
						wordId: word.id,
						sentenceId: sentenceId,
						userId: userId,
						isKnown: true
					}))
			);

			knowledge = await fetchAggregateKnowledge();

			await showNextSentence();
		} catch (e: any) {
			console.error(e);

			error = e.message;
		}
	}
</script>

<main>
	{#if error}
		<h3>{error}</h3>
	{/if}

	{#if current}
		<Sentence
			word={current.words.find(({ id }) => id == current?.wordId)}
			sentence={current.sentence}
			revealed={current.revealed}
			{onUnknown}
			{onExplain}
			{knowledge}
		/>

		<button on:click|preventDefault={store} disabled={isCalculatingNext}> Next </button>
	{/if}
</main>
