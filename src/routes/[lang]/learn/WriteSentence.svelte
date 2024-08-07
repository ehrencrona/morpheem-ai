<script lang="ts">
	import type { SendKnowledge } from '$lib/SendKnowledge';
	import { exerciseToString } from '$lib/exerciseToString';
	import { filterUndefineds } from '$lib/filterUndefineds';
	import { logError } from '$lib/logError';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { CodedError } from '../../../CodedError';
	import Speak from '../../../components/Speak.svelte';
	import Spinner from '../../../components/Spinner.svelte';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import Tutorial from '../../../components/Tutorial.svelte';
	import { KNOWLEDGE_TYPE_WRITE } from '../../../db/knowledgeTypes';
	import type * as DB from '../../../db/types';
	import type { ExerciseSource } from '../../../db/types';
	import type { WriteEvaluation } from '../../../logic/evaluateWrite';
	import type { Fragment } from '../../../logic/isomorphic/translationToFragments';
	import { translationToFragments } from '../../../logic/isomorphic/translationToFragments';
	import { isSeparator, toWordsWithSeparators } from '../../../logic/toWordStrings';
	import type { ExerciseKnowledge, Language, WordKnowledge } from '../../../logic/types';
	import { getLanguageOnClient } from '../api/api-call';
	import { fetchClauses } from '../api/sentences/[sentence]/clauses/client';
	import type { Translation } from '../api/sentences/[sentence]/english/client';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { lookupUnknownWord } from '../api/word/unknown/client';
	import { fetchAskMeAnything } from '../api/write/ama/client';
	import { sendWrittenSentence } from '../api/write/client';
	import { fetchWriteEvaluation } from '../api/write/evaluate/client';
	import AMA from './AMA.svelte';
	import ClauseCardDumb from './ClauseCardDumb.svelte';
	import WordCard from './WordCard.svelte';
	import { getCorrectedParts } from './getCorrectedParts';

	export let word: { id: number; word: string; level: number } | undefined;
	export let onNext: () => Promise<any>;
	export let fetchTranslation: () => Promise<Translation>;
	export let sendKnowledge: SendKnowledge;
	export let sentence: DB.Sentence;
	export let language: Language;

	export let exercise: 'write' | 'translate' = 'write';
	export let exerciseId: number | null;
	export let source: ExerciseSource;

	export let isAdmin: boolean;

	/** The sentence to translate if translate, otherwise the writing idea. */
	export let translation: Translation | undefined;

	let fragments: Fragment[] | undefined;
	let revealedClauses: DB.Clause[] = [];

	/** The target language sentence if translate. */
	export let correctSentence: string | undefined;

	let showIdea = false;

	let feedback: WriteEvaluation | undefined;
	let entered: string;

	let showChars: number = 0;
	let unknownWords: UnknownWordResponse[] = [];
	let isLoadingUnknown = false;
	let isFetchingEvaluation = false;

	let lookedUpWord: UnknownWordResponse | undefined;

	let input: HTMLElement;

	$: sentenceId = sentence?.id;
	$: isRevealed = word && (showChars > 2 || showChars > word.word.length - 1);

	$: correctParts =
		feedback && !feedback.isCorrect
			? getCorrectedParts(
					feedback.correctedSentence,
					filterUndefineds(feedback.correctedParts.map(({ correction }) => correction))
				)
			: undefined;
	$: enteredParts = feedback
		? getCorrectedParts(
				entered,
				filterUndefineds(feedback.correctedParts.map(({ userWrote }) => userWrote))
			)
		: undefined;

	function clear() {
		entered = '';
		unknownWords = [];
		showChars = 0;
		feedback = undefined;
		lookedUpWord = undefined;
		showIdea = false;
		fragments = undefined;
		revealedClauses = [];
		isFetchingEvaluation = false;

		if (exercise == 'write') {
			lookupUnknownWord(word!.word)
				.then((word) => (lookedUpWord = word))
				.catch(logError);

			if (!translation) {
				getTranslation().catch(logError);
			}
		} else {
			fetchClauses(sentenceId)
				.then((gotClauses) => {
					translation = gotClauses;
					fragments = translationToFragments(translation.english, gotClauses.clauses);
				})
				.catch(logError);
		}
	}

	async function onLookup(wordString: string) {
		isLoadingUnknown = true;

		try {
			const word = await lookupUnknownWord(wordString, { sentence: feedback?.correctedSentence });

			unknownWords = dedup([...unknownWords, word]);
		} finally {
			isLoadingUnknown = false;
		}
	}

	$: if (word || sentenceId) {
		clear();
	}

	$: if (word || sentenceId) {
		input?.focus();
	}

	onMount(() => {
		input.focus();
	});

	const onSubmit = async () => {
		entered = entered.trim();

		if (!entered || entered.length < 4) {
			throw new CodedError('Please enter a sentence', 'sentenceMissing');
		}

		if (!translation) {
			logError(`Had no translation when fetching write evaluation`);
		}

		isFetchingEvaluation = true;

		try {
			feedback = await fetchWriteEvaluation(
				exercise == 'write'
					? {
							exercise,
							entered,
							word: word!.word,
							english: lookedUpWord!.english
						}
					: {
							exercise,
							english: translation?.english || '',
							correct: sentence.sentence,
							entered,
							revealedClauses
						}
			);
		} finally {
			isFetchingEvaluation = false;
		}

		console.log(
			`Feedback on "${entered}":\nCorrected sentence: ${feedback.correctedSentence}\n` +
				`Corrected part: ${feedback.correctedParts.map((part) => `"${part.userWrote}" -> "${part.correction}" (severity ${part.severity})`).join(', ') || 'none'}\n` +
				`User exercises: ${feedback.userExercises.map(exerciseToString).join(', ')}`
		);
	};

	const store = async ({
		feedback,
		entered,
		unknownWords
	}: {
		feedback: WriteEvaluation;
		entered: string;
		unknownWords: UnknownWordResponse[];
	}) => {
		const studiedWordId = word?.id;

		let { sentence: newSentence, knowledge: gotKnowledge } = await sendWrittenSentence({
			wordId: studiedWordId,
			sentence: feedback.correctedSentence || entered,
			entered
		});

		const newSentenceId = newSentence.id;

		const knowledge: (WordKnowledge & { word: DB.Word })[] = gotKnowledge.map((k) => ({
			...k,
			isKnown: !unknownWords.some(({ id }) => id == k.wordId) && k.isKnown,
			studiedWordId
		}));

		for (const word of unknownWords) {
			if (!knowledge.some(({ wordId }) => wordId == word.id)) {
				knowledge.push({
					isKnown: false,
					wordId: word.id,
					studiedWordId,
					sentenceId,
					word,
					type: KNOWLEDGE_TYPE_WRITE,
					userId: 0
				});
			}
		}

		let userExercises = feedback.userExercises.map(
			(e) =>
				({
					...e,
					sentenceId: e.sentenceId == -1 ? newSentenceId : e.sentenceId
				}) as ExerciseKnowledge
		);

		sendKnowledge(knowledge, userExercises);
	};

	const clickedContinue = async () => {
		if (!feedback) {
			throw new Error('Invalid state');
		}

		const userExercise: ExerciseKnowledge | undefined = exerciseId
			? exercise == 'write'
				? {
						sentenceId: sentenceId,
						exercise: 'write',
						id: exerciseId,
						word: word!.word,
						wordId: word!.id,
						level: word!.level || 20,
						isKnown: true
					}
				: {
						sentenceId: sentenceId,
						exercise: 'translate',
						id: exerciseId,
						level: word?.level || 20,
						isKnown: true
					}
			: undefined;

		store({ feedback, entered, unknownWords }).catch((e) => isAdmin && logError(e));

		// send the user exercise and word here since there is otherwise a risk
		// we get the exercise again before the storing completes
		if (userExercise || word) {
			sendKnowledge(
				word
					? [
							{
								isKnown: true,
								word: {
									...word,
									type: undefined
								},
								wordId: word.id,
								studiedWordId: word.id,
								sentenceId: sentenceId,
								type: KNOWLEDGE_TYPE_WRITE,
								userId: 0
							}
						]
					: [],
				userExercise ? [userExercise] : []
			);
		}

		return onNext();
	};

	const onHint = async () => {
		showChars++;

		if ((showChars > 2 || showChars > word!.word.length - 1) && lookedUpWord) {
			unknownWords = [...unknownWords, lookedUpWord];
			showChars = 99;
		}
	};

	const getTranslation = async () => {
		translation = await fetchTranslation();
	};

	function dedup(words: UnknownWordResponse[]) {
		return words.filter((word, index) => words.findIndex((w) => w.id == word.id) == index);
	}

	const askMeAnything = async (question: string) => {
		const answer = await fetchAskMeAnything({
			exercise,
			question,
			word: word?.word,
			sentence: translation?.english,
			sentenceEntered: entered,
			sentenceCorrected: exercise == 'write' ? feedback?.correctedSentence || undefined : undefined,
			correctTranslation: exercise == 'translate' ? correctSentence : undefined
		});

		return answer;
	};

	const onIdea = async () => {
		await getTranslation();
		showIdea = true;
	};
</script>

<div>
	<form>
		{#if !feedback}
			{#if exercise === 'translate'}
				<div class="text-sm mb-6">
					<div class="text-xs font-lato">Translate into {language.name}:</div>
					<div class="text-xl">
						{#if fragments}
							"{#each fragments as fragment}{#if fragment.clauses.length}{#if !fragment.clauses.some( (c) => revealedClauses.includes(c) )}<button
											type="button"
											on:click={() => {
												revealedClauses = [...revealedClauses, ...fragment.clauses];
											}}
											class="inline hover:underline decoration-yellow">{fragment.fragment}</button
										>{:else}<span class="inline border-b-2 border-blue-3 border-dotted"
											>{fragment.fragment}</span
										>{/if}{:else}{fragment.fragment}{/if}{/each}"
						{:else if translation}
							"{translation.english}"
						{:else}
							<Spinner />
						{/if}
					</div>
				</div>

				<div class="text-xs font-lato mb-4">
					{#if source == 'userExercise'}
						You wrote this sentence earlier but got it wrong. See if you can remember the correct
						version.
					{/if}

					Click on a word in the English sentence to get help translating it.
				</div>
			{:else}
				<p class="mb-4 font-lato text-xs">
					{#if lookedUpWord}
						Write a sentence or fragment using the {language.name} word for "<b
							>{lookedUpWord.english}</b
						>"
					{:else}
						<Spinner />
					{/if}
				</p>
			{/if}

			{#if exercise == 'translate' && sentence.sentence.length > (typeof window != 'undefined' && window.innerWidth > 768 ? 60 : 30)}
				<textarea
					bind:value={entered}
					bind:this={input}
					class="bg-blue-1 rounded-sm block w-full p-2 text-sans text-lg mb-6 transition-colors {isFetchingEvaluation
						? ' text-darker-gray'
						: ''}"
					lang={getLanguageOnClient().code}
					disabled={isFetchingEvaluation}
					on:keydown|preventDefault={(event) => {
						if (event.key == 'Enter') {
							onSubmit();
						}
					}}
				></textarea>
			{:else}
				<input
					type="text"
					bind:value={entered}
					bind:this={input}
					class="bg-blue-1 rounded-sm block w-full p-2 text-sans text-lg mb-6 transition-colors {isFetchingEvaluation
						? ' text-darker-gray'
						: ''}"
					lang={getLanguageOnClient().code}
					disabled={isFetchingEvaluation}
				/>
			{/if}

			{#if showChars > 0 && !isRevealed}
				<div class="text-xs font-lato mb-6">
					The word starts with <b>"{word?.word.slice(0, showChars)}..."</b>
				</div>
			{/if}

			{#if showIdea && translation}
				<div class="text-sm mb-6" in:slide>
					<div class="text-xs font-lato">Maybe write this in {language.name}?</div>
					<div class="text-xl">"{translation.english}"</div>
				</div>
			{/if}
		{:else}
			{#if exercise == 'translate' && translation}
				<div class="text-sm mb-3">
					Translate "{translation.english}"
				</div>
			{/if}
			{#if enteredParts}
				<div
					class="text-xl font-sans font-bold mb-6 text-balance {feedback.isCorrect
						? 'text-green'
						: ''}"
				>
					{#each enteredParts as part}
						{#if part.isCorrected}
							<span class="line-through text-red">{part.part}</span>
						{:else}
							{part.part}
						{/if}
					{/each}
				</div>
			{/if}

			<div class="mb-6 text-sm text-balance">
				{feedback.feedback}
			</div>

			{#if correctParts}
				<div class="text-xl font-sans font-bold mb-6 text-balance">
					{#each correctParts as part}
						{#if part.isCorrected}
							<span class="text-green">
								{#each toWordsWithSeparators(part.part, language) as word, index}{#if isSeparator(word)}{word}{:else}<span
											style="cursor: pointer"
											role="button"
											tabindex={index}
											class={unknownWords.find((r) => (r.inflected || r.word) == word)
												? 'border-b-2 border-green border-dotted'
												: 'hover:underline decoration-green'}
											on:click|preventDefault={() => onLookup(word)}>{word}</span
										>{/if}{/each}
							</span>
						{:else}
							{part.part}
						{/if}
					{/each}
				</div>
			{/if}
		{/if}

		{#if revealedClauses.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4 mt-8" transition:slide>
				{#each revealedClauses as clause}
					<ClauseCardDumb
						{clause}
						onRemove={() => (revealedClauses = revealedClauses.filter((c) => c != clause))}
					/>
				{/each}
			</div>
		{/if}

		{#if unknownWords.length > 0 || isLoadingUnknown}
			<div
				class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4 mt-8 items-stretch"
				transition:slide
			>
				{#each unknownWords as word}
					<WordCard
						{word}
						onRemove={() => (unknownWords = unknownWords.filter(({ id }) => id != word.id))}
					/>
				{/each}
				{#if isLoadingUnknown}
					<div class="flex justify-center items-center">
						<Spinner />
					</div>
				{/if}
			</div>
		{/if}

		<div class="mt-8">
			{#if !feedback}
				{#if exercise === 'write'}
					{#if !isRevealed}
						<SpinnerButton onClick={onHint} type="secondary">Hint word</SpinnerButton>
					{/if}

					{#if translation && !showIdea}
						<SpinnerButton onClick={onIdea} type="secondary">Writing idea</SpinnerButton>
					{/if}
				{/if}

				<SpinnerButton onClick={onSubmit} isSubmit={true}>Submit</SpinnerButton>
			{:else}
				{#if exercise == 'write'}
					<!-- 
					 When writing unconstrained there's a risk it misunderstands what you're trying to say; then you want to be able to reformulate.
					 With translate that won't happen.
					-->

					<SpinnerButton onClick={async () => (feedback = undefined)} type="secondary">
						Reformulate
					</SpinnerButton>
				{/if}

				<SpinnerButton onClick={clickedContinue} grabFocus={true}>Continue</SpinnerButton>
			{/if}
		</div>

		{#if feedback && exercise == 'translate'}
			<Speak url={`/${language.code}/api/sentences/${sentenceId}/tts.opus`} />
		{/if}
	</form>

	<Tutorial
		paragraphs={[
			`Use "ask me anything" if you need help with vocabulary or grammar.`,
			`Don't worry about making mistakes; that's how you learn.`,
			`If you use a word correctly, we'll remember that you know it. Any mistakes will be turned into new exercises for you.`
		].concat(
			exercise == 'write' ? `Use "hint word" if you're not sure which the word is meant.` : []
		)}
		id="write"
	/>

	<AMA
		suggestions={[`How do you say 'to scratch'?`, `traffic light in ${language.name}?`]}
		ask={askMeAnything}
		wordId={word?.id}
	/>
</div>
