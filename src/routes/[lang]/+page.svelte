<script lang="ts">
	import { page } from '$app/stores';
	import { logError } from '$lib/logError';
	import { getClozePreference } from '$lib/settings';
	import { onMount } from 'svelte';
	import { CodedError } from '../../CodedError';
	import ErrorMessage from '../../components/ErrorMessage.svelte';
	import SpinnerButton from '../../components/SpinnerButton.svelte';
	import type * as DB from '../../db/types';
	import {
		calculateSentenceWriteKnowledge,
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
	import { toPercent } from '$lib/toPercent';

	export let data: PageData;

	$: userExercises = data.userExercises;
	$: languageCode = data.languageCode;

	let exerciseFilter = $page.url.searchParams.get('exercise');

	let knowledge: DB.AggKnowledgeForUser[] = [];
	let wordsKnown: { read: number; write: number };

	let current:
		| ({
				word: DB.Word | undefined;
				sentence: DB.Sentence;
				words: SentenceWord[];
				source: DB.ExerciseSource;
		  } & (
				| {
						wordId: number;
						words: SentenceWord[];
						exercise: 'read' | 'cloze' | 'cloze-inflection';
				  }
				| {
						wordId: number | null;
						exercise: 'write' | 'translate';
				  }
		  ))
		| undefined;

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
			logError(e);

			setTimeout(
				() => sendKnowledgeClient(knowledgeToSend, addUserExercises).catch(logError),
				5000
			);
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
		excludeWordId,
		excludeSentenceId
	}: {
		exercises?: (ScoreableExercise & { score: number; wordType: DB.WordType | undefined })[];
		excludeWordId?: number;
		excludeSentenceId?: number;
	}): Promise<{
		sentence: CandidateSentenceWithWords & { english?: string | null };
		wordId: number | null;
		exercise: ExerciseType;
		source: DB.ExerciseSource;
		getNextPromise: () => Promise<any>;
	}> {
		const filter = ({ wordId, sentenceId, exercise }: ScoreableExercise) =>
			!(excludeWordId && wordId == excludeWordId) &&
			!(excludeSentenceId && sentenceId == excludeSentenceId) &&
			(!exerciseFilter || exercise == exerciseFilter);

		exercises = exercises.filter(filter);

		if (!exercises.length) {
			const unscored = ([] as (ScoreableExercise & { wordType: DB.WordType | undefined })[])
				.concat(getExercisesForKnowledge(knowledge))
				.concat(
					userExercises.map((e) => ({
						...e,
						wordType: undefined,
						source: 'userExercise' as DB.ExerciseSource
					}))
				);

			exercises = scoreExercises(unscored).filter(filter);
		}

		if (!exercises.length) {
			throw new Error('No exercises found');
		}

		{
			const exercise = exercises[0];

			const n = now();
			const toPercent = (n: number | null) => (n != null ? Math.round(n * 100) + '%' : '-');

			console.log(
				`Choosing ${exercise.source} ${exercise.exercise} ${exercise.word ? `${exercise.word} (${exercise.wordId}), ` : ''}sentence ${exercise.sentenceId}: ${toPercent(exercise.alpha)}/${toPercent(exercise.beta)}, age ${n - exercise.lastTime} = ${toPercent(exercise.score)}`
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

			const isRelevant = (e: { score: number }) => e.score > 0.02;

			if (exercises.some(isRelevant)) {
				exercises = exercises.filter(isRelevant).slice(0, 6);
			} else {
				console.warn(`All exercises had very low score.`);
			}
		}

		let { wordId, wordType, exercise, source, sentenceId } = exercises[0];

		if (sentenceId != undefined) {
			try {
				let sentence = await fetchCandidateSentence(sentenceId);

				return {
					sentence,
					wordId,
					exercise,
					source,
					getNextPromise: () =>
						getNextExercise({
							exercises: exercises.slice(1),
							excludeWordId: wordId || undefined,
							excludeSentenceId: sentenceId
						})
				};
			} catch (e) {
				logError(`While fetching sentence ${sentenceId}: ${e}`);
			}
		}

		if (!wordId) {
			throw new Error('No wordId or sentenceId');
		}

		try {
			let sentences = (await fetchSentencesWithWord(wordId)).filter(
				({ id }) => id != excludeSentenceId
			);
			let nextSentence = getNextSentence(sentences, knowledge, wordId, exercise);

			if (!nextSentence || (nextSentence.score < 0.93 && exercise != 'write')) {
				try {
					sentences = sentences.concat(await addSentencesForWord(wordId));
				} catch (e) {
					logError(`While adding sentences for ${wordId}: ${e}`);
				}

				console.log(
					`Added ${sentences.length} sentences for word ${wordId}: ${sentences.map((s) => s.sentence) + '\n'}`
				);

				nextSentence = getNextSentence(sentences, knowledge, wordId, exercise);

				if (!nextSentence) {
					console.error(`No sentences found for word ${wordId}`);

					return getNextExercise({
						exercises: exercises.slice(1),
						excludeWordId: wordId
					});
				}
			}

			const { sentence } = nextSentence;

			if (exercise == 'write') {
				const wordKnowledge = expectedKnowledge(exercises[0], { now: now(), exercise: 'write' });
				const sentenceWriteKnowledge = calculateSentenceWriteKnowledge(sentence, knowledge);

				if (wordKnowledge < 0.7) {
					console.log(
						`Knowledge of ${wordId} is only ${toPercent(wordKnowledge)}, turning write into cloze.`
					);

					exercise = 'cloze';
				} else if (sentenceWriteKnowledge > 0.7) {
					console.log(
						`Turning write exercise into translate for ${sentence.id} (sentence write knowledge ${toPercent(sentenceWriteKnowledge)}).`
					);

					exercise = 'translate';
				} else if (wordType == 'particle') {
					console.log(`Turning write exercise into cloze for particle ${wordId}.`);

					exercise = 'cloze';
				}

				// -2 -> .5, 2 -> .1
				const clozeThreshold = 0.3 - getClozePreference() / 10;

				if ((exercise == 'write' || exercise == 'translate') && Math.random() > clozeThreshold) {
					console.log(
						`Cloze threshold of ${toPercent(clozeThreshold)} exceeded, turning into cloze.`
					);

					exercise = 'cloze';
				}
			}

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
			if (e instanceof CodedError && e.code == 'wrongLemma') {
				knowledge = knowledge.filter((k) => wordId != k.wordId);
			} else {
				logError(e);
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
		} = await (nextPromise ||
			getNextExercise({
				excludeSentenceId: current?.sentence.id || undefined,
				excludeWordId: current?.wordId || undefined
			}));

		nextPromise = getNext();

		if (exercise != 'write') {
			markSentenceSeen(sentence.id).catch(logError);
		}

		const word = sentence.words.find(({ id }) => id == wordId);

		if (!word && wordId) {
			console.warn(
				`Sentence ${sentence.id} ("${sentence.sentence}") has no word ${word} (${wordId}), only ${sentence.words.map(({ id }) => id).join(', ')}`
			);

			return showNextSentence();
		}

		if (exercise == 'write' || exercise == 'translate') {
			current = {
				word,
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
				word,
				wordId,
				words: sentence.words,
				sentence,
				source,
				exercise
			};
		}
	}

	onMount(() => init().catch(logError));

	const getTranslation = () => fetchTranslation(current!.sentence.id);

	async function onNext() {
		wordsKnown = calculateWordsKnown(knowledge);

		sendWordsKnown(wordsKnown).catch(logError);

		await showNextSentence();
	}
</script>

<main class="font-sans bold w-full" use:trackActivity>
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
		<div class="flex mb-6 pb-3 -mx-4 pr-4 bg-[#f9f9f9] lg:bg-white -mt-4 pt-4">
			<div class="flex-1 font-lato text-xs flex items-center">
				{#if current.source == 'unstudied'}
					<div class="bg-red text-[#fff] px-1 font-sans text-xxs">NEW WORD</div>
				{/if}
			</div>

			<div class="font-lato text-xs flex gap-3 justify-end">
				{#if data.user == 'ehrencrona' && current.wordId}
					<a href={`/${languageCode}/words/${current.wordId}`} class=" text-gray-1"> Word </a>
				{/if}

				<a href={`/${languageCode}/sentences/${current?.sentence.id}/delete`} class=" text-gray-1">
					Delete sentence
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
				word={current.word}
				sentence={current.sentence}
				words={current.words}
				language={getLanguageOnClient()}
				{onNext}
				{sendKnowledge}
			/>
		{:else if current.exercise == 'write' || current.exercise == 'translate'}
			<WriteSentence
				word={current.word}
				{onNext}
				language={getLanguageOnClient()}
				{sendKnowledge}
				exercise={current.exercise}
				source={current.source}
				sentenceId={current.sentence.id}
				translation={{
					english: current.sentence.english || '',
					transliteration: current.sentence.transliteration || ''
				}}
				correctSentence={current.sentence.sentence}
				fetchTranslation={getTranslation}
			/>
		{:else if ['cloze', 'cloze-inflection'].includes(current.exercise) && current.word}
			<Cloze
				word={current.word}
				{onNext}
				source={current.source}
				sentence={current.sentence}
				sentenceWords={current.words}
				language={getLanguageOnClient()}
				{sendKnowledge}
				exercise={current.exercise}
				{knowledge}
			/>
		{:else}
			<p class="text-red">Unknown exercise type ${current.exercise}</p>

			<SpinnerButton onClick={onNext}>Next</SpinnerButton>
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

	<ErrorMessage />
</main>
