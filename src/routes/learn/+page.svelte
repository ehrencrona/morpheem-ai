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

	let knowledge: AggKnowledgeForUser[] = [];

	let current:
		| {
				sentence: DB.Sentence;
				words: DB.Word[];
				revealed: (UnknownWordResponse & { explanation?: string[] })[];
		  }
		| undefined;

	async function init() {
		knowledge = await fetchAggregateKnowledge();

		console.log(`Loaded ${knowledge.length} knowledge entries`);

		next();
	}

	async function next() {
		const nextWords = getNextWords(knowledge);

		const nextWord = nextWords[0];

		addSentencesForWord(nextWords[1]).catch(console.error);

		const sentences = await fetchSentencesWithWord(nextWord);

		const nextSentence = getNextSentence(sentences, knowledge, nextWord);

		markSentenceSeen(nextSentence.id).catch(console.error);

		current = {
			sentence: nextSentence,
			words: nextSentence.words,
			revealed: []
		};
	}

	onMount(init);

	async function onExplain(lemma: string) {
		if (!current) {
			throw new Error('Invalid state');
		}

		const explanation = await explainWord(lemma);

		current.revealed = current.revealed.map((r) => {
			if (r.lemma.toLowerCase() === lemma.toLowerCase()) {
				r.explanation = explanation;
			}

			return r;
		});
	}

	async function onUnknown(word: string) {
		if (!current) {
			throw new Error('Invalid state');
		}

		if (current.revealed.find((r) => r.word.toLowerCase() === word.toLowerCase())) {
			return;
		}

		const unknownWord = await lookupUnknownWord(word, current.sentence.id);

		current.revealed = [...current.revealed, unknownWord];
	}

	let error: string;

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

			await next();
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
		<Sentence sentence={current.sentence} revealed={current.revealed} {onUnknown} {onExplain} />

		<button on:click|preventDefault={store}> Next </button>
	{/if}
</main>
