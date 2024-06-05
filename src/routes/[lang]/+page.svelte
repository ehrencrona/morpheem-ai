<script lang="ts">
	import { onMount } from 'svelte';
	import { CodedError } from '../../CodedError';
	import ErrorComponent from '../../components/Error.svelte';
	import type * as DB from '../../db/types';
	import {
		getExercisesForKnowledge,
		getNextSentence,
		scoreExercises
	} from '../../logic/isomorphic/getNext';
	import { expectedKnowledge, now } from '../../logic/isomorphic/knowledge';
	import { updateKnowledge } from '../../logic/isomorphic/updateKnowledge';
	import { updateUserExercises } from '../../logic/isomorphic/updateUserExercises';
	import { calculateWordsKnown } from '../../logic/isomorphic/wordsKnown';
	import type {
		CandidateSentenceWithWords,
		ExerciseKnowledge,
		ExerciseType,
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
	import { fetchCandidateSentence, markSentenceSeen } from './api/sentences/[sentence]/client';
	import { fetchTranslation } from './api/sentences/[sentence]/english/client';
	import {
		addSentencesForWord,
		fetchSentencesWithWord
	} from './api/sentences/withword/[word]/client';
	import Cloze from './learn/Cloze.svelte';
	import ReadSentence from './learn/ReadSentence.svelte';
	import WriteSentence from './learn/WriteSentence.svelte';
	import { trackActivity } from './learn/trackActivity';

	export let data: PageData;

	$: userExercises = data.userExercises;
	$: languageCode = data.languageCode;

	let knowledge: DB.AggKnowledgeForUser[] = [];
	let wordsKnown: { read: number; write: number };

	let current:
		| ({
				sentence: DB.Sentence;
				words: SentenceWord[];
				source: DB.ExerciseSource;
		  } & (
				| {
						wordId: number;
						words: SentenceWord[];
						exercise: 'read' | 'cloze';
				  }
				| {
						wordId: number | null;
						exercise: 'write';
				  }
		  ))
		| undefined;

	$: word = current?.words.find(({ id }) => id == current?.wordId)!;

	async function init() {
		knowledge = await fetchAggregateKnowledge();
		wordsKnown = calculateWordsKnown(knowledge);

		console.log(`Loaded ${knowledge.length} knowledge entries`);

		await showNextSentence();
	}

	function sendKnowledge(
		words: (WordKnowledge & { word: DB.Word })[],
		addUserExercises?: ExerciseKnowledge[]
	) {
		const knowledgeToSend = words.map(({ word, ...rest }) => rest);

		sendKnowledgeClient(knowledgeToSend, addUserExercises).catch((e) => {
			console.error(e);

			setTimeout(() => {
				sendKnowledgeClient(knowledgeToSend, addUserExercises).catch((e) => {
					error = e;
				});
			}, 5000);
		});

		knowledge = updateKnowledge(words, knowledge);

		if (addUserExercises) {
			userExercises = updateUserExercises(addUserExercises, userExercises);
		}
	}

	let nextPromise: ReturnType<typeof getNextExercise>;

	interface ScoreableExercise extends DB.Scoreable {
		word: string | null;
		wordId: number | null;
		sentenceId?: number;
		exercise: ExerciseType;
		source: DB.ExerciseSource;
	}

	async function getNextExercise({
		exercises = [],
		excludeWordId
	}: {
		exercises?: (ScoreableExercise & { score: number })[];
		excludeWordId?: number;
	}): Promise<
		| {
				sentence: CandidateSentenceWithWords;
				wordId: number;
				exercise: ExerciseType;
				source: DB.ExerciseSource;
				getNextPromise: () => Promise<any>;
		  }
		| {
				sentence: CandidateSentenceWithWords;
				wordId: null;
				exercise: ExerciseType;
				source: DB.ExerciseSource;
				getNextPromise: () => Promise<any>;
		  }
	> {
		if (!exercises.length) {
			const unscored = ([] as ScoreableExercise[])
				.concat(
					getExercisesForKnowledge(knowledge).filter(({ wordId }) => wordId !== excludeWordId)
				)
				.concat(
					userExercises.map((e) => ({
						...e,
						source: 'userExercise' as DB.ExerciseSource
					}))
				);

			exercises = scoreExercises(unscored);
		}

		{
			const exercise = exercises[0];

			// deleteme
			exercise.exercise = 'cloze';

			const n = now();
			const toPercent = (n: number | null) => (n != null ? Math.round(n * 100) + '%' : '-');

			console.log(
				`Knowledge of ${exercise.wordId}: ${toPercent(exercise.alpha)}/${toPercent(exercise.beta)}, age ${n - exercise.lastTime} = ${toPercent(exercise.score)}`
			);

			for (const source of ['studied', 'userExercise', 'unstudied'] as const) {
				console.log(
					`Next ${source}:\n` +
						exercises
							.filter((s) => s.source == source)
							.slice(0, 10)
							.map(
								(e, j) =>
									`${j + 1}.${e.word ? ' ' + e.word : ''} ${e.exercise}${e.sentenceId != null ? `, sentence ${e.sentenceId}` : ''} (${e.wordId}, score ${Math.round(e.score * 100)}%, age ${n - e.lastTime}, knowledge ${Math.round(
										100 * expectedKnowledge(e, { now: n, exercise: e.exercise })
									)}% level ${e.level})`
							)
							.join(`\n`)
				);
			}

			exercises = exercises.filter((e) => e.score > 0.02).slice(0, 6);
		}

		const { wordId, exercise, source, sentenceId } = exercises[0];

		if (sentenceId != undefined) {
			let sentence = await fetchCandidateSentence(sentenceId);

			return {
				sentence,
				wordId,
				exercise,
				source,
				getNextPromise: () => getNextExercise({ exercises: exercises.slice(1) })
			};
		}

		if (!wordId) {
			throw new Error('No wordId or sentenceId');
		}

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

					return getNextExercise({
						exercises: exercises.slice(1),
						excludeWordId: wordId
					});
				}
			}

			const { sentence, score } = nextSentence;

			return {
				sentence,
				wordId,
				source,
				exercise,
				getNextPromise: () =>
					getNextExercise({
						exercises: exercises.slice(1),
						excludeWordId: wordId
					})
			};
		} catch (e: any) {
			console.error(e);

			if (e instanceof CodedError && e.code == 'wrongLemma') {
				knowledge = knowledge.filter((k) => wordId != k.wordId);
			} else {
				error = e.message;
			}

			return getNextExercise({
				exercises: exercises.slice(1),
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
			source
		} = await (nextPromise || getNextExercise({}));

		nextPromise = getNext();

		if (exercise == 'read' || exercise == 'cloze') {
			markSentenceSeen(sentence.id).catch((e) => (error = e));
		}

		if (exercise == 'write') {
			current = {
				wordId: wordId,
				words: sentence.words,
				sentence,
				source,
				exercise
			};
		} else {
			if (!wordId) {
				throw new Error(`No wordId for ${exercise} exercise from ${source}`);
			}

			current = {
				wordId: wordId,
				words: sentence.words,
				sentence,
				source,
				exercise
			};
		}

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
	<ErrorComponent {error} onClear={() => (error = undefined)} />

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
				{#if current.source == 'unstudied'}
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
				source={current.source}
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
