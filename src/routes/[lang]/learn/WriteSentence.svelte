<script lang="ts">
	import type { SendKnowledge } from '$lib/SendKnowledge';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import Error from '../../../components/Error.svelte';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import type { WritingFeedbackResponse } from '../../../logic/generateWritingFeedback';
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

	export let word: { id: number; word: string; level: number } | undefined;
	export let onNext: () => Promise<any>;
	export let fetchEnglishSentence: () => Promise<string>;
	export let sendKnowledge: SendKnowledge;
	export let sentenceId: number;
	export let language: Language;

	export let exercise: 'write' | 'translate' = 'write';

	/** The sentence to translate if translate, otherwise the writing idea. */
	export let englishSentence: string | undefined;
	/** The target language sentence if translate. */
	export let correctSentence: string | undefined;

	let showIdea = false;

	let feedback: WritingFeedbackResponse | undefined;
	let entered: string;

	let error: any;

	let showChars: number = 0;
	let unknownWords: UnknownWordResponse[] = [];

	let lookedUpWord: UnknownWordResponse | undefined;

	let input: HTMLInputElement;

	$: isRevealed = word && (showChars > 2 || showChars > word.word.length - 1);

	function clear() {
		entered = '';
		feedback = undefined;
		unknownWords = [];
		showChars = 0;
		lookedUpWord = undefined;
		showIdea = false;

		if (exercise == 'write') {
			lookupUnknownWord(word!.word, undefined)
				.then((word) => (lookedUpWord = word))
				.catch((e) => (error = e));
		}

		if (exercise === 'translate' && !englishSentence) {
			getEnglishSentence().catch((e) => (error = e));
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
			error = 'Please enter a sentence';
			return;
		}

		feedback =
			exercise == 'write'
				? await fetchWritingFeedback({
						exercise,
						word: word!.word,
						entered
					})
				: await fetchWritingFeedback({
						exercise,
						entered,
						english: englishSentence!,
						correct: correctSentence!
					});

		console.log(
			`Feedback on "${entered}":\nCorrected sentence: ${feedback.correctedSentence}\n` +
				`Corrected part: ${feedback.correctedPart}\n` +
				`Unknown words: ${feedback.unknownWords.map((u) => u.word).join(', ')}\n` +
				`User exercises: ${feedback.userExercises.map((e) => `${e.isKnown ? 'knew' : 'did not know'} ${e.exercise} (word ${e.word})`).join(', ')}`
		);

		unknownWords = dedup([...unknownWords, ...feedback!.unknownWords]);
	};

	const clickedContinue = async () => {
		if (!feedback) {
			error = 'Invalid state';
			return;
		}

		const studiedWordId = word?.id;

		let newSentenceId = sentenceId;

		const sentence = await sendWrittenSentence({
			wordId: studiedWordId!,
			sentence: feedback.correctedSentence || correctSentence!,
			entered,
			createNewSentence: exercise == 'write'
		});

		if (sentence?.id) {
			newSentenceId = sentence.id;
		}

		const knowledge = feedback.knowledge.map((k) => ({
			...k,
			studiedWordId,
			sentenceId: newSentenceId
		}));

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

	const getEnglishSentence = async () => {
		englishSentence = await fetchEnglishSentence();
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
			sentenceCorrected: exercise == 'write' ? feedback?.correctedSentence || undefined : undefined
		});

		if (!feedback) {
			fetchProvidedWordsInAnswer({ question, answer })
				.then((words) => (unknownWords = dedup([...unknownWords, ...words])))
				.catch(console.error);
		}

		return answer;
	};

	const onIdea = async () => {
		try {
			await getEnglishSentence();
			showIdea = true;
		} catch (e) {
			error = e;
		}
	};
</script>

<Error {error} onClear={() => (error = undefined)} />

<div>
	{#if exercise == 'write'}
		<h1 class="mb-4 text-xl">
			{#if isRevealed}
				{word?.word}
			{:else if lookedUpWord}"{lookedUpWord?.english}"{:else}...{/if}
		</h1>
	{/if}

	<form>
		{#if !feedback}
			{#if exercise === 'translate'}
				<div class="text-sm mb-6" in:slide>
					<div class="text-xs font-lato">Translate into {language.name}:</div>
					<div class="text-xl">"{englishSentence || '...'}"</div>
				</div>
			{:else}
				<p class="mb-4 font-lato text-xs">
					Write a sentence or fragment using the {language.name} word for "<b
						>{lookedUpWord?.english || '...'}</b
					>"
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

			{#if showIdea && englishSentence}
				<div class="text-sm mb-6" in:slide>
					<div class="text-xs font-lato">Maybe write this in {language.name}?</div>
					<div class="text-xl">"{englishSentence}"</div>
				</div>
			{/if}
		{:else}
			{#if !!feedback.correctedPart}
				<div class="text-xl font-bold mb-6 text-balance line-through">
					{entered}
				</div>
			{/if}

			<div class="mb-6 font-lato text-xs">
				{feedback.feedback}
			</div>

			<div class="text-xl font-bold mb-6 text-balance">
				{exercise == 'write' ? feedback.correctedSentence || entered : correctSentence}
			</div>
		{/if}

		{#if unknownWords.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4 mt-8" transition:slide>
				{#each unknownWords as word}
					<WordCard
						{...word}
						{word}
						onRemove={() => (unknownWords = unknownWords.filter((word) => word.id != word.id))}
					/>
				{/each}
			</div>
		{/if}

		<div class="mt-8">
			{#if !feedback}
				{#if exercise === 'write'}
					{#if !isRevealed}
						<SpinnerButton onClick={onHint} type="secondary">Hint</SpinnerButton>
					{/if}

					{#if englishSentence}
						<SpinnerButton onClick={onIdea} type="secondary">Idea</SpinnerButton>
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

	<AMA
		suggestions={[`How do you say 'to scratch'?`, `traffic light in ${language.name}?`]}
		ask={askMeAnything}
		wordId={word?.id}
	/>
</div>
