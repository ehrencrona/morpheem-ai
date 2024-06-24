<script lang="ts">
	import type { SendKnowledge } from '$lib/SendKnowledge';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import type { WritingFeedbackResponse } from '../../../logic/evaluateWrite';
	import type { Language } from '../../../logic/types';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { lookupUnknownWord } from '../api/word/unknown/client';
	import { fetchAskMeAnything } from '../api/write/ama/client';
	import { fetchProvidedWordsInAnswer } from '../api/write/ama/provided/client';
	import { sendWrittenSentence } from '../api/write/client';
	import { fetchWritingFeedback } from '../api/write/feedback/client';
	import AMA from './AMA.svelte';
	import WordCard from './WordCard.svelte';
	import Speak from '../../../components/Speak.svelte';
	import Spinner from '../../../components/Spinner.svelte';
	import { splitIntoDiff } from '$lib/splitIntoDiff';
	import type { Translation } from '../api/sentences/[sentence]/english/client';
	import Tutorial from '../../../components/Tutorial.svelte';
	import { logError } from '$lib/logError';
	import type { ExerciseSource } from '../../../db/types';
	import { CodedError } from '../../../CodedError';
	import { KNOWLEDGE_TYPE_READ, KNOWLEDGE_TYPE_WRITE } from '../../../db/knowledgeTypes';

	export let word: { id: number; word: string; level: number } | undefined;
	export let onNext: () => Promise<any>;
	export let fetchTranslation: () => Promise<Translation>;
	export let sendKnowledge: SendKnowledge;
	export let sentenceId: number;
	export let language: Language;

	export let exercise: 'write' | 'translate' = 'write';
	export let source: ExerciseSource;

	/** The sentence to translate if translate, otherwise the writing idea. */
	export let translation: Translation | undefined;
	/** The target language sentence if translate. */
	export let correctSentence: string | undefined;

	let showIdea = false;

	let feedback: WritingFeedbackResponse | undefined;
	let entered: string;

	let showChars: number = 0;
	let unknownWords: UnknownWordResponse[] = [];

	let lookedUpWord: UnknownWordResponse | undefined;

	let input: HTMLInputElement;

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

		if (exercise == 'write') {
			lookupUnknownWord(word!.word, undefined)
				.then((word) => (lookedUpWord = word))
				.catch(logError);
		}

		if (!translation) {
			getTranslation().catch(logError);
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

		feedback = await fetchWritingFeedback(
			exercise == 'write'
				? {
						exercise,
						entered,
						word: word!.word
					}
				: {
						exercise,
						entered,
						english: translation?.english || '',
						correct: correctSentence!
					}
		);

		console.log(
			`Feedback on "${entered}":\nCorrected sentence: ${feedback.correctedSentence}\n` +
				`Corrected part: ${feedback.correctedPart}\n` +
				`Unknown words: ${feedback.unknownWords.map((u) => u.word).join(', ')}\n` +
				`User exercises: ${feedback.userExercises.map((e) => `${e.isKnown ? 'knew' : 'did not know'} ${e.exercise} (word ${e.word || '-'})`).join(', ')}`
		);

		unknownWords = dedup([...unknownWords, ...feedback!.unknownWords]);
	};

	const clickedContinue = async () => {
		if (!feedback) {
			throw new Error('Invalid state');
		}

		const studiedWordId = word?.id;

		let newSentenceId = sentenceId;

		const sentence = await sendWrittenSentence({
			wordId: studiedWordId,
			sentence: feedback.correctedSentence || correctSentence!,
			entered,
			createNewSentence: exercise == 'write'
		});

		if (sentence?.id) {
			newSentenceId = sentence.id;
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

		const userExercises = feedback.userExercises.map((e) => ({
			...e,
			sentenceId: newSentenceId
		}));

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
						{#if translation}
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
				lang="pl"
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
				{correctParts[0]}<span class="text-green">{correctParts[1]}</span>{correctParts[2]}
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
