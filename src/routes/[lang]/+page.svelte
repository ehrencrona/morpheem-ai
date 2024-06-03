<script lang="ts">
	import { onMount } from 'svelte';
	import { CodedError } from '../../CodedError';
	import { knowledgeTypeToExercise } from '../../db/knowledgeTypes';
	import type * as DB from '../../db/types';
	import { getNextSentence, getNextWords } from '../../logic/isomorphic/getNext';
	import {
		didNotKnow,
		didNotKnowFirst,
		knew,
		knewFirst,
		now
	} from '../../logic/isomorphic/knowledge';
	import { calculateWordsKnown } from '../../logic/isomorphic/wordsKnown';
	import type {
		AggKnowledgeForUser,
		Exercise,
		SentenceWord,
		WordKnowledge
	} from '../../logic/types';
	import type { PageData } from './$types';
	import { getLanguageOnClient } from './api/api-call';
	import {
		fetchAggregateKnowledge,
		sendKnowledge as sendKnowledgeClient
	} from './api/knowledge/client';
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
	import Error from '../../components/Error.svelte';

	export let data: PageData;

	$: languageCode = data.languageCode;

	let knowledge: AggKnowledgeForUser[] = [];
	let wordsKnown: { read: number; write: number };

	let current:
		| {
				wordId: number;
				sentence: DB.Sentence;
				words: SentenceWord[];
				exercise: Exercise;
				studied: false | undefined;
		  }
		| undefined;

	$: word = current?.words.find(({ id }) => id == current?.wordId)!;

	async function init() {
		knowledge = await fetchAggregateKnowledge();
		wordsKnown = calculateWordsKnown(knowledge);

		console.log(`Loaded ${knowledge.length} knowledge entries`);

		await showNextSentence();
	}

	const toPercent = (n: number | null) => (n != null ? Math.round(n * 100) + '%' : '-');

	function sendKnowledge(words: (WordKnowledge & { word: DB.Word })[]) {
		const byWord = new Map(words.map((w) => [w.wordId, w]));

		const knowledgeToSend = words.map(({ word, ...rest }) => rest);

		sendKnowledgeClient(knowledgeToSend).catch((e) => {
			console.error(e);

			setTimeout(() => {
				sendKnowledgeClient(knowledgeToSend).catch((e) => {
					error = e;
				});
			}, 5000);
		});

		knowledge = knowledge.map((k) => {
			const word = byWord.get(k.wordId);

			const lastTime = now();

			if (word) {
				byWord.delete(k.wordId);

				const opts = { now: lastTime, exercise: knowledgeTypeToExercise(word.type) };

				let aggKnowledge: AggKnowledgeForUser;

				if (word.isKnown) {
					aggKnowledge = { ...k, ...knew(k, opts), lastTime, studied: undefined };
				} else {
					aggKnowledge = {
						...k,
						...didNotKnow(k, opts),
						lastTime,
						studied: undefined
					};
				}

				console.log(
					`Updated knowledge for word ${k.word} (${k.wordId}). knew: ${word.isKnown}, exercise: ${
						opts.exercise
					}, alpha: ${toPercent(aggKnowledge.alpha)} beta: ${toPercent(aggKnowledge.beta)}`
				);

				return aggKnowledge;
			} else {
				return k;
			}
		});

		if (byWord.size) {
			let newWords: DB.Word[] = Array.from(byWord.values()).map((w) => w.word);

			const newKnowledge = new Array(...byWord).map(([, k]) => {
				const exercise = knowledgeTypeToExercise(k.type);
				const word = newWords.find((w) => w.id === k.wordId)!;

				const aggKnowledge = {
					wordId: k.wordId,
					lastTime: now(),
					level: word.level,
					word: word.word,
					...(k.isKnown ? knewFirst(exercise) : didNotKnowFirst(exercise))
				};

				console.log(
					`New knowledge for word ${aggKnowledge.word} (${aggKnowledge.wordId}). knew: ${k.isKnown}, exercise: ${exercise}, alpha: ${toPercent(aggKnowledge.alpha)} beta: ${toPercent(aggKnowledge.beta)}`
				);

				return aggKnowledge;
			});

			knowledge = [...knowledge, ...newKnowledge];
		}
	}

	let nextPromise: ReturnType<typeof calculateNextSentence>;

	async function calculateNextSentence({
		wordIds = [],
		excludeWordId
	}: {
		wordIds?: { wordId: number; exercise: Exercise; studied: false | undefined }[];
		excludeWordId?: number;
	}) {
		if (!wordIds.length) {
			wordIds = getNextWords(knowledge).filter(({ wordId }) => wordId !== excludeWordId);
		}

		const wordId = wordIds[0].wordId;
		const exercise = wordIds[0].exercise;
		const studied = wordIds[0].studied;

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
				studied,
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
			exercise,
			studied
		} = await (nextPromise || calculateNextSentence({}));

		nextPromise = getNext();

		if (exercise == 'read' || exercise == 'cloze') {
			markSentenceSeen(sentence.id).catch((e) => (error = e));
		}

		current = {
			wordId: wordId,
			words: sentence.words,
			sentence,
			studied,
			exercise
		};

		error = undefined;
	}

	onMount(() => init().catch((e) => (error = e)));

	const getTranslation = () => fetchTranslation(current!.sentence.id);

	let error: string | undefined = undefined;

	async function onNext() {
		try {
			wordsKnown = calculateWordsKnown(knowledge);

			sendWordsKnown(wordsKnown).catch((e) => (error = e));

			await showNextSentence();
		} catch (e: any) {
			console.error(e);

			error = e.message;
		}
	}
</script>

<main class="font-sans bold w-full" use:trackActivity>
	<Error {error} onClear={() => (error = undefined)} />

	{#if wordsKnown}
		<a
			href="{languageCode}/home"
			class="bg-blue-3 text-center text-blue-1 p-2 rounded-md top-2 right-2 absolute hidden lg:block"
		>
			<b class="font-sans text-3xl font-bold">{wordsKnown.read}</b>
			<div class="text-xs font-lato">passive vocabulary</div>
			<b class="font-sans text-3xl font-bold">{wordsKnown.write}</b>
			<div class="text-xs font-lato">active vocabulary</div>
		</a>
	{/if}

	{#if current}
		<div class="flex mb-6">
			<div class="flex-1 font-lato text-xs flex items-center">
				{#if current.studied == false}
					<div class="bg-red text-[#fff] px-1 font-sans text-xxs">NEW WORD</div>
				{/if}
			</div>

			<div class="font-lato text-xs flex gap-2 justify-end">
				<a href={`/${languageCode}/home`} class="underline text-red"> History </a>

				{#if word}
					<a href={`/${languageCode}/words/${word.id}"`} class="underline text-red"> Word </a>
				{/if}

				<a
					href={`/${languageCode}/sentences/${current?.sentence.id}/delete`}
					class="underline text-red"
				>
					Sentence is wrong
				</a>
			</div>
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
				{sendKnowledge}
			/>
		{:else if current.exercise == 'write'}
			<WriteSentence
				{word}
				{onNext}
				fetchIdea={getTranslation}
				language={getLanguageOnClient()}
				{sendKnowledge}
			/>
		{:else if current.exercise == 'cloze'}
			<Cloze
				{word}
				{knowledge}
				{onNext}
				sentence={current.sentence}
				sentenceWords={current.words}
				language={getLanguageOnClient()}
				{sendKnowledge}
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
