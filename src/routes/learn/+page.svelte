<script lang="ts">
	import { onMount } from 'svelte';
	import type * as DB from '../../db/types';
	import { getNextSentence, getNextWords } from '../../logic/isomorphic/getNext';
	import type { AggKnowledgeForUser } from '../../logic/types';
	import { userId } from '../../logic/user';
	import { fetchAggregateKnowledge, sendKnowledge } from '../api/knowledge/client';
	import {
		addSentencesForWord,
		fetchSentencesWithWord
	} from '../api/sentences/withword/[word]/client';
	import Sentence from './Sentence.svelte';
	import { markSentenceSeen } from '../api/sentences/[sentence]/client';

	let knowledge: AggKnowledgeForUser[] = [];

	let current:
		| {
				sentence: DB.Sentence;
				words: DB.Word[];
				revealedWords: { id: number }[];
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
			revealedWords: []
		};
	}

	onMount(init);

	async function onReveal(word: DB.Word) {
		if (!current) {
			throw new Error('Invalid state');
		}

		current.revealedWords.push(word);

		await sendKnowledge([
			{
				wordId: word.id!,
				sentenceId: current.sentence.id,
				userId: userId,
				isKnown: false
			}
		]);
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
					.filter((word) => !current!.revealedWords.includes(word))
					.map((word) => ({
						wordId: word.id!,
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
		<Sentence sentence={current.sentence} words={current.words} {onReveal} />

		<button on:click|preventDefault={store}> Next </button>
	{/if}
</main>
