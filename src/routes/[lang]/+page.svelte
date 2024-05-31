<script lang="ts">
	import { onMount } from 'svelte';
	import { CodedError } from '../../CodedError';
	import type * as DB from '../../db/types';
	import { getNextSentence, getNextWords } from '../../logic/isomorphic/getNext';
	import { calculateWordsKnown } from '../../logic/isomorphic/wordsKnown';
	import type { AggKnowledgeForUser, Exercise, SentenceWord } from '../../logic/types';
	import { getLanguageOnClient } from './api/api-call';
	import { fetchAggregateKnowledge } from './api/knowledge/client';
	import { sendWordsKnown } from './api/knowledge/words-known/client';
	import { markSentenceSeen } from './api/sentences/[sentence]/client';
	import { fetchTranslation } from './api/sentences/[sentence]/english/client';
	import {
		addSentencesForWord,
		fetchSentencesWithWord
	} from './api/sentences/withword/[word]/client';
	import Cloze from './learn/Cloze.svelte';
	import ReadSentence from './learn/ReadSentence.svelte';
	import WriteSentence from './learn/WriteSentence.svelte';
	import { trackActivity } from './learn/trackActivity';
	import type { PageData } from './$types';

	export let data: PageData;

	let knowledge: AggKnowledgeForUser[] = [];
	let wordsKnown: { read: number; write: number };

	let current:
		| {
				wordId: number;
				sentence: DB.Sentence;
				words: SentenceWord[];
				exercise: Exercise;
		  }
		| undefined;

	$: word = current?.words.find(({ id }) => id == current?.wordId)!;

	async function init() {
		knowledge = await fetchAggregateKnowledge();
		wordsKnown = calculateWordsKnown(knowledge);

		console.log(`Loaded ${knowledge.length} knowledge entries`);

		showNextSentence();
	}

	let nextPromise: ReturnType<typeof calculateNextSentence>;

	async function calculateNextSentence({
		wordIds = [],
		excludeWordId
	}: {
		wordIds?: { wordId: number; exercise: Exercise }[];
		excludeWordId?: number;
	}) {
		if (!wordIds.length) {
			wordIds = getNextWords(knowledge).filter(({ wordId }) => wordId !== excludeWordId);
		}

		let wordId = wordIds[0].wordId;
		let exercise = wordIds[0].exercise;

		try {
			let sentences = await fetchSentencesWithWord(wordId);
			let nextSentence = getNextSentence(sentences, knowledge, wordId);

			if (!nextSentence || nextSentence.score < 0.93) {
				try {
					sentences = sentences.concat(await addSentencesForWord(wordId));
				} catch (e) {
					console.error(`While adding sentences for ${wordId}: ${e}`);
				}

				console.log(
					`Added ${sentences.length} sentences for word ${wordId}: ${sentences.map((s) => s.sentence) + '\n'}`
				);

				nextSentence = getNextSentence(sentences, knowledge, wordId);

				if (!nextSentence) {
					console.error(`No sentences found for word ${wordId}`);

					return calculateNextSentence({
						wordIds: wordIds.slice(1),
						excludeWordId: wordId
					});
				}
			}

			const { sentence, score } = nextSentence;

			return {
				sentence,
				wordId,
				getNextPromise: () =>
					calculateNextSentence({
						wordIds: wordIds.slice(1),
						excludeWordId: wordId
					}),
				exercise
			};
		} catch (e: any) {
			console.log(e);

			if (e instanceof CodedError && e.code == 'wrongLemma') {
				knowledge = knowledge.filter((k) => wordId != k.wordId);
			} else {
				error = e.message;
			}

			return calculateNextSentence({
				wordIds: wordIds.slice(1),
				excludeWordId: wordId
			});
		}
	}

	async function showNextSentence() {
		const {
			sentence,
			wordId,
			getNextPromise: getNext,
			exercise
		} = await (nextPromise || calculateNextSentence({}));

		nextPromise = getNext();

		const k = knowledge.find((k) => k.wordId === wordId)!;
		// const wordKnowledge = k ? expectedKnowledge(k, { now: now() }) : 0;

		// const type = 'read';
		// wordKnowledge > 0.6 ? (Math.random() > 0.8 ? 'write' : 'cloze') : 'read';

		if (exercise == 'read' || exercise == 'cloze') {
			markSentenceSeen(sentence.id).catch(console.error);
		}

		current = {
			wordId: wordId,
			sentence,
			words: sentence.words,
			exercise
		};

		error = undefined;
	}

	onMount(init);

	const getTranslation = () => fetchTranslation(current!.sentence.id);

	let error: string | undefined = undefined;

	async function onNext() {
		try {
			knowledge = await fetchAggregateKnowledge();
			wordsKnown = calculateWordsKnown(knowledge);

			sendWordsKnown(wordsKnown).catch(console.error);

			await showNextSentence();
		} catch (e: any) {
			console.error(e);

			error = e.message;
		}
	}
</script>

<main class="font-sans bold w-full" use:trackActivity>
	{#if error}
		<h3>{error}</h3>
	{/if}

	{#if wordsKnown}
		<a
			href="{getLanguageOnClient().code}/home"
			class="bg-blue-3 text-center text-blue-1 p-2 rounded-md top-2 right-2 absolute hidden lg:block"
		>
			<b class="font-sans text-3xl font-bold">{wordsKnown.read}</b>
			<div class="text-xs font-lato">passive vocabulary</div>
			<b class="font-sans text-3xl font-bold">{wordsKnown.write}</b>
			<div class="text-xs font-lato">active vocabulary</div>
		</a>
	{/if}

	{#if current}
		<div class="text-right font-lato text-xs flex gap-1 mb-4 justify-end">
			<a
				href={`/${getLanguageOnClient().code}/sentences/${current?.sentence.id}/delete`}
				class="underline text-red"
			>
				Delete sentence
			</a>
		</div>

		{#if wordsKnown?.read < 10}
			<p class="bg-blue-1 border border-blue-4 py-2 px-4 rounded-sm inline-block text-sm mb-6">
				If you don't want to start from a complete beginner level, take the <a
					href={`${data.languageCode}/test`}
					class="underline">placement test</a
				>.
			</p>
		{/if}

		{#if current.exercise == 'read'}
			<ReadSentence
				{word}
				{knowledge}
				sentence={current.sentence}
				words={current.words}
				language={getLanguageOnClient()}
				{onNext}
			/>
		{:else if current.exercise == 'write'}
			<WriteSentence {word} {onNext} fetchIdea={getTranslation} language={getLanguageOnClient()} />
		{:else if current.exercise == 'cloze'}
			<Cloze
				{word}
				{knowledge}
				{onNext}
				sentence={current.sentence}
				sentenceWords={current.words}
				language={getLanguageOnClient()}
			/>
		{/if}
	{:else}
		<div class="text-center mt-12">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="1em"
				height="1em"
				viewBox="0 0 24 24"
				class="inline-block"
			>
				<path
					fill="currentColor"
					d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"
				>
					<animateTransform
						attributeName="transform"
						dur="0.75s"
						repeatCount="indefinite"
						type="rotate"
						values="0 12 12;360 12 12"
					/>
				</path>
			</svg>
		</div>
	{/if}
</main>
