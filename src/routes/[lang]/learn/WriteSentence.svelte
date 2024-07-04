<script lang="ts">
	import type { SendKnowledge } from '$lib/SendKnowledge';
	import { logError } from '$lib/logError';
	import { splitIntoDiff } from '$lib/splitIntoDiff';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { CodedError } from '../../../CodedError';
	import type { Clause } from '../../../ai/splitIntoClauses';
	import Speak from '../../../components/Speak.svelte';
	import Spinner from '../../../components/Spinner.svelte';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import Tutorial from '../../../components/Tutorial.svelte';
	import { KNOWLEDGE_TYPE_WRITE } from '../../../db/knowledgeTypes';
	import type { ExerciseSource } from '../../../db/types';
	import type { WriteEvaluation } from '../../../logic/evaluateWrite';
	import type { Fragment } from '../../../logic/isomorphic/translationToFragments';
	import { translationToFragments } from '../../../logic/isomorphic/translationToFragments';
	import type { ExerciseKnowledge, Language } from '../../../logic/types';
	import { fetchClauses } from '../api/sentences/[sentence]/clauses/client';
	import type { Translation } from '../api/sentences/[sentence]/english/client';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { lookupUnknownWord } from '../api/word/unknown/client';
	import { fetchAskMeAnything } from '../api/write/ama/client';
	import { fetchProvidedWordsInAnswer } from '../api/write/ama/provided/client';
	import { sendWrittenSentence } from '../api/write/client';
	import { fetchWriteEvaluation as fetchWriteEvaluation } from '../api/write/evaluate/client';
	import AMA from './AMA.svelte';
	import WordCard from './WordCard.svelte';
	import type * as DB from '../../../db/types';
	import { getLanguageOnClient } from '../api/api-call';

	export let word: { id: number; word: string; level: number } | undefined;
	export let onNext: () => Promise<any>;
	export let fetchTranslation: () => Promise<Translation>;
	export let sendKnowledge: SendKnowledge;
	export let sentence: DB.Sentence;
	export let language: Language;

	export let exercise: 'write' | 'translate' = 'write';
	export let exerciseId: number | null;
	export let source: ExerciseSource;

	/** The sentence to translate if translate, otherwise the writing idea. */
	export let translation: Translation | undefined;

	let fragments: Fragment[] | undefined;
	let revealedClauses: Clause[] = [];

	/** The target language sentence if translate. */
	export let correctSentence: string | undefined;

	let showIdea = false;

	let feedback: WriteEvaluation | undefined;
	let entered: string;

	let showChars: number = 0;
	let unknownWords: UnknownWordResponse[] = [];

	let lookedUpWord: UnknownWordResponse | undefined;

	let input: HTMLInputElement;

	$: sentenceId = sentence?.id;
	$: isRevealed = word && (showChars > 2 || showChars > word.word.length - 1);

	$: correct = exercise == 'write' ? feedback?.correctedSentence || entered : correctSentence;
	$: correctParts = splitIntoDiff(correct, entered);
	$: enteredParts = splitIntoDiff(entered, correct);

	function clear() {
		entered = '';
		unknownWords = [];
		showChars = 0;
		feedback = undefined;
		lookedUpWord = undefined;
		showIdea = false;
		fragments = undefined;
		revealedClauses = [];

		if (exercise == 'write') {
			lookupUnknownWord(word!.word, undefined)
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

		if (!entered) {
			throw new CodedError('Please enter a sentence', 'sentenceMissing');
		}

		feedback = await fetchWriteEvaluation(
			exercise == 'write'
				? {
						exercise,
						exerciseId,
						entered,
						word: word!.word
					}
				: {
						exercise,
						exerciseId,
						entered,
						sentenceId,
						english: translation?.english || '',
						correct: correctSentence!,
						revealedClauses
					}
		);

		console.log(
			`Feedback on "${entered}":\nCorrected sentence: ${feedback.correctedSentence}\n` +
				`Corrected part: ${feedback.correctedPart}\n` +
				`Unknown words: ${feedback.unknownWords.map((u) => u.word).join(', ')}\n` +
				`User exercises: ${feedback.userExercises.map((e) => `${e.isKnown ? 'knew' : 'did not know'} ${e.exercise}${'phrase' in e ? ` phrase "${e.phrase}" ` : ''}${'word' in e ? ` (word ${e.word})` : ''}`).join(', ')}`
		);

		unknownWords = dedup([...unknownWords, ...feedback!.unknownWords]);
	};

	const clickedContinue = async () => {
		if (!feedback) {
			throw new Error('Invalid state');
		}

		const studiedWordId = word?.id;

		let newSentenceId = sentenceId;

		const newSentence = await sendWrittenSentence({
			wordId: studiedWordId,
			sentence: feedback.correctedSentence || entered,
			entered,
			createNewSentence: exercise == 'write'
		});

		if (newSentence?.id) {
			newSentenceId = newSentence.id;
		}

		const knowledge = feedback.knowledge.map((k) => ({
			...k,
			isKnown: !unknownWords.some(({ id }) => id == k.wordId) && k.isKnown,
			studiedWordId,
			sentenceId: newSentenceId
		}));

		for (const word of unknownWords) {
			if (!knowledge.some(({ wordId }) => wordId == word.id)) {
				knowledge.push({
					isKnown: false,
					word: word,
					wordId: word.id,
					studiedWordId,
					sentenceId,
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

		if (!feedback) {
			fetchProvidedWordsInAnswer({ question, answer })
				.then((words) => (unknownWords = dedup([...unknownWords, ...words])))
				.catch(logError);
		}

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
							{#each fragments as fragment}
								{#if fragment.clauses.length}
									{#if !fragment.clauses.some((c) => revealedClauses.includes(c))}
										<button
											type="button"
											on:click={() => {
												revealedClauses = [...revealedClauses, ...fragment.clauses];
											}}
											class="inline hover:underline decoration-yellow"
											>{fragment.fragment}
										</button>
									{:else}
										<span class="inline border-b-2 border-blue-3 border-dotted"
											>{fragment.fragment}
										</span>
									{/if}
								{:else}
									{fragment.fragment}
								{/if}
							{/each}
						{:else if translation}
							"{translation.english}"
						{:else}
							<Spinner />
						{/if}
					</div>
				</div>

				{#if source == 'userExercise'}
					<div class="text-xs font-lato mb-4">
						You wrote this sentence earlier but got it wrong. See if you can remember the correct
						version.
					</div>
				{/if}
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

			<input
				type="text"
				bind:value={entered}
				bind:this={input}
				class="bg-blue-1 rounded-sm block w-full p-2 text-lg mb-6"
				lang={getLanguageOnClient().code}
			/>

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
			{#if !!feedback.correctedPart}
				<div class="text-xl font-bold mb-6 text-balance">
					{enteredParts[0]}<span class="line-through text-red">{enteredParts[1]}</span
					>{enteredParts[2]}
				</div>
			{/if}

			<div class="mb-6 font-lato text-xs">
				{feedback.feedback}
			</div>

			<div class="text-xl font-bold mb-6 text-balance">
				{#if feedback.correctedPart}
					{correctParts[0]}<span class="text-green">{correctParts[1]}</span>{correctParts[2]}
				{:else}
					<span class="text-green">{entered}</span>
				{/if}
			</div>
		{/if}

		{#if revealedClauses.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4 mt-8" transition:slide>
				{#each revealedClauses as clause}
					<div class="bg-light-gray rounded-md w-full border border-gray md:max-w-[500px] mb-4">
						<div
							class="font-medium mb-1 flex bg-blue-3 text-[#fff] px-3 py-2 rounded-t-md items-baseline"
						>
							{clause.sentence}
						</div>

						<div class="px-3 pb-4">
							<div class="text-balance font-lato mt-2">
								{clause.english}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		{#if unknownWords.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4 mt-8" transition:slide>
				{#each unknownWords as word}
					<WordCard
						{word}
						onRemove={() => (unknownWords = unknownWords.filter(({ id }) => id != word.id))}
					/>
				{/each}
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
				<SpinnerButton onClick={async () => (feedback = undefined)} type="secondary">
					Try again
				</SpinnerButton>

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
