<script lang="ts">
	import { page } from '$app/stores';
	import { logError } from '$lib/logError';
	import { getClozePreference } from '$lib/settings';
	import { toPercent } from '$lib/toPercent';
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
	import PhraseCloze from './learn/PhraseCloze.svelte';
	import ReadSentence from './learn/ReadSentence.svelte';
	import WriteSentence from './learn/WriteSentence.svelte';
	import { exerciseToString } from '$lib/exerciseToString';
	import { trackActivity } from './learn/trackActivity';
	import { filterUndefineds } from '$lib/filterUndefineds';

	export let data: PageData;

	$: userExercises = data.userExercises;
	$: languageCode = data.languageCode;

	let exerciseFilter = $page.url.searchParams.get('exercise');

	let knowledge: DB.AggKnowledgeForUser[] = [];
	let wordsKnown: { read: number; write: number };

	let current:
		| ({
				sentence: DB.Sentence;
				words: SentenceWord[];
				source: DB.ExerciseSource;
				id: number | null;
		  } & DB.ScoreableExercise &
				(
					| {
							// TODO: rename
							wordObject: DB.Word | undefined;
							wordId: number;
							exercise: 'read' | 'cloze' | 'cloze-inflection';
					  }
					| {
							// TODO: rename
							wordObject: DB.Word | undefined;
							wordId: number | null;
							exercise: 'write';
					  }
					| {
							exercise: 'translate';
					  }
					| {
							exercise: 'phrase-cloze';
							hint: string;
					  }
				))
		| undefined;

	async function init() {
		knowledge = await fetchAggregateKnowledge();
		wordsKnown = calculateWordsKnown(knowledge);

		console.log(`Loaded ${knowledge.length} knowledge entries`);

		await showNextSentence();
	}

	let userExercisesBeingUpdated: number[] = [];

	function sendKnowledge(
		words: (WordKnowledge & { word: DB.Word })[],
		addUserExercises?: ExerciseKnowledge[]
	) {
		const knowledgeToSend = words.map(({ word, ...rest }) => rest);

		knowledge = updateKnowledge(words, knowledge);

		userExercisesBeingUpdated = filterUndefineds(
			(addUserExercises || []).map((e) => e.id || undefined)
		);

		sendKnowledgeClient(knowledgeToSend, addUserExercises)
			.catch(async (e) => {
				logError(e);

				await new Promise((resolve) => setTimeout(resolve, 5000));

				return sendKnowledgeClient(knowledgeToSend, addUserExercises);
			})
			.then((res) => {
				userExercises = updateUserExercises(res, userExercises);
				userExercisesBeingUpdated = [];
			})
			.catch(logError);
	}

	let nextPromise: ReturnType<typeof getNextExercise>;

	async function getNextExercise({
		exercises = [],
		excludeWordId,
		excludeSentenceId
	}: {
		exercises?: (DB.ScoreableExercise & { score: number; wordType: DB.WordType | undefined })[];
		excludeWordId?: number;
		excludeSentenceId?: number;
	}): Promise<
		DB.ScoreableExercise & {
			sentence: CandidateSentenceWithWords & { english?: string | null };
			getNextPromise: () => Promise<any>;
		}
	> {
		const filter = (e: DB.ScoreableExercise) =>
			!(excludeWordId && 'wordId' in e && e.wordId == excludeWordId) &&
			!(excludeSentenceId && e.sentenceId == excludeSentenceId) &&
			(e.id == null || !userExercisesBeingUpdated.includes(e.id)) &&
			(!exerciseFilter || e.exercise == exerciseFilter);

		exercises = exercises.filter(filter);

		if (!exercises.length) {
			const unscored = ([] as (DB.ScoreableExercise & { wordType: DB.WordType | undefined })[])
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

		for (const source of ['studied', 'userExercise', 'unstudied'] as const) {
			console.log(
				`Next ${source}:\n` +
					exercises
						.filter((s) => s.source == source)
						.slice(0, 6)
						.map((e, j) => `${j + 1}. ${exerciseToString(e)})`)
						.join(`\n`)
			);
		}

		const isRelevant = (e: { score: number }) => e.score > 0.02;

		if (exercises.some(isRelevant)) {
			exercises = exercises.filter(isRelevant).slice(0, 6);
		} else {
			console.warn(`All exercises had very low score.`);
		}

		const firstExercise = exercises[0];
		let { wordType, exercise, sentenceId } = firstExercise;

		console.log(`Choosing ${exerciseToString(firstExercise)}`);

		const wordId = 'wordId' in firstExercise ? firstExercise.wordId : null;

		if (sentenceId != -1) {
			try {
				let sentence = await fetchCandidateSentence(sentenceId);

				return {
					...firstExercise,
					sentenceId,
					sentence,
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
			logError(`No sentence or wordId for exercise ${exerciseToString(firstExercise)}`);

			return getNextExercise({
				exercises: exercises.slice(1),
				excludeSentenceId: sentenceId != -1 ? sentenceId : undefined
			});
		}

		try {
			let sentences = (await fetchSentencesWithWord(wordId)).filter(
				({ id }) => id != excludeSentenceId
			);
			let nextSentence = getNextSentence(sentences, knowledge, wordId, exercise);

			if (!nextSentence || nextSentence.score < 0.93) {
				let newSentences: CandidateSentenceWithWords[] = [];

				try {
					newSentences = await addSentencesForWord(wordId);
				} catch (e) {
					logError(`While adding sentences for ${wordId}: ${e}`);
				}

				console.log(
					`Added ${newSentences.length} sentences for word ${wordId}: ${newSentences.map((s) => s.sentence) + '\n'}`
				);

				sentences = sentences.concat(newSentences);

				nextSentence = getNextSentence(sentences, knowledge, wordId, exercise);

				if (!nextSentence) {
					logError(`No sentences found for word ${wordId}`);

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

				if (wordKnowledge < 0.5) {
					console.log(
						`Knowledge of ${wordId} is only ${toPercent(wordKnowledge)}, turning write into cloze.`
					);

					exercise = 'cloze';
				} else if (sentenceWriteKnowledge > 0.8) {
					console.log(
						`Turning write exercise into translate for ${sentence.id} (sentence write knowledge ${toPercent(sentenceWriteKnowledge)}).`
					);

					exercise = 'translate';
				} else if (wordType == 'particle') {
					console.log(`Turning write exercise into cloze for particle ${wordId}.`);

					exercise = 'cloze';
				}
			}

			const clozeThreshold = [1, 0.7, 0.4, 0.3, 0.2][getClozePreference() + 2];

			if ((exercise == 'write' || exercise == 'translate') && Math.random() > clozeThreshold) {
				console.log(
					`Cloze threshold of ${toPercent(clozeThreshold)} exceeded for word ${wordId}, turning into cloze.`
				);

				exercise = 'cloze';
			}

			return {
				...firstExercise,
				sentence,
				exercise: exercise as any,
				getNextPromise: () =>
					getNextExercise({
						exercises: exercises.slice(1),
						excludeWordId: wordId,
						excludeSentenceId: sentence.id != -1 ? sentence.id : undefined
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
		const next = await (nextPromise ||
			getNextExercise({
				excludeSentenceId: current?.sentence.id || undefined,
				excludeWordId: current && 'wordId' in current ? current.wordId || undefined : undefined
			}));

		const { sentence, getNextPromise: getNext, exercise, source } = next;

		nextPromise = getNext();

		if (exercise != 'write') {
			markSentenceSeen(sentence.id).catch(logError);
		}

		const wordId = 'wordId' in next ? next.wordId : null;
		let word: SentenceWord | undefined;

		if (wordId) {
			word = sentence.words.find(({ id }) => id == wordId);

			if (!word) {
				console.warn(
					`Sentence ${sentence.id} ("${sentence.sentence}") has no word ${word} (${wordId}), only ${sentence.words.map(({ id }) => id).join(', ')}`
				);

				return showNextSentence();
			}
		}

		console.log(`Current exercise: ${exerciseToString(next)}`);

		if (next.exercise == 'write') {
			current = {
				...next,
				wordObject: word!,
				words: sentence.words,
				sentence
			};
		} else if (next.exercise == 'translate') {
			current = {
				...next,
				words: sentence.words,
				sentence
			};
		} else if (exercise == 'phrase-cloze') {
			current = {
				...next,
				sentence,
				words: sentence.words
			};
		} else {
			if (!wordId) {
				throw new Error(`No wordId for exercise ${exerciseToString(next)} from ${source}`);
			}

			current = {
				...next,
				wordObject: word!,
				words: sentence.words,
				sentence
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
			href="{languageCode}/progress"
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
				{#if current.id != null}
					<div>
						Exercise #{current.id}
					</div>
				{/if}

				<div>
					Sentence #{current.sentence.id}
				</div>

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
				word={current.wordObject}
				sentence={current.sentence}
				words={current.words}
				language={getLanguageOnClient()}
				{onNext}
				{sendKnowledge}
			/>
		{:else if current.exercise == 'write'}
			<WriteSentence
				word={current.wordObject}
				{onNext}
				language={getLanguageOnClient()}
				{sendKnowledge}
				exercise={current.exercise}
				exerciseId={current.id}
				source={current.source}
				sentence={current.sentence}
				translation={current.sentence.english
					? {
							english: current.sentence.english,
							transliteration: current.sentence.transliteration || ''
						}
					: undefined}
				correctSentence={current.sentence.sentence}
				fetchTranslation={getTranslation}
			/>
		{:else if current.exercise == 'translate'}
			<WriteSentence
				word={undefined}
				{onNext}
				language={getLanguageOnClient()}
				{sendKnowledge}
				exercise={current.exercise}
				exerciseId={current.id}
				source={current.source}
				sentence={current.sentence}
				translation={current.sentence.english
					? {
							english: current.sentence.english,
							transliteration: current.sentence.transliteration || ''
						}
					: undefined}
				correctSentence={current.sentence.sentence}
				fetchTranslation={getTranslation}
			/>
		{:else if (current.exercise == 'cloze' || current.exercise == 'cloze-inflection') && current.wordObject}
			<Cloze
				word={current.wordObject}
				{onNext}
				exerciseId={current.id}
				sentence={current.sentence}
				sentenceWords={current.words}
				language={getLanguageOnClient()}
				{sendKnowledge}
				exercise={current.exercise}
				{knowledge}
			/>
		{:else if current.exercise == 'phrase-cloze'}
			<PhraseCloze
				{onNext}
				sentence={current.sentence}
				sentenceWords={current.words}
				language={getLanguageOnClient()}
				{sendKnowledge}
				hint={current.hint}
				phrase={current.phrase}
				exercise={current}
				onBrokenExercise={() => {
					logError(`Broken exercise #${current?.id}`);
					showNextSentence();
				}}
			/>
		{:else}
			<p class="text-red">Unknown exercise type ${current.exercise}</p>

			<SpinnerButton onClick={onNext}>Next</SpinnerButton>
		{/if}
	{:else}
		<div class="text-center mt-12">
			<svg width="1em" height="1em" viewBox="0 0 24 24" class="inline-block">
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
