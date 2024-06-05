<script lang="ts">
	import { slide } from 'svelte/transition';
	import Error from '../../../components/Error.svelte';
	import Spinner from '../../../components/Spinner.svelte';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import type * as DB from '../../../db/types';
	import { isSeparator, toWordsWithSeparators } from '../../../logic/toWords';
	import type { Language } from '../../../logic/types';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { fetchAskMeAnything } from '../api/write/ama/client';
	import Ama from './AMA.svelte';
	import WordCard from './WordCard.svelte';

	export let sentence: DB.Sentence;
	export let word: DB.Word | undefined;
	export let knowledge: DB.AggKnowledgeForUser[] | undefined = undefined;
	export let language: Language;

	export let revealed: UnknownWordResponse[];

	export let onUnknown: (word: string) => Promise<any>;
	export let onRemoveUnknown: (word: string) => Promise<any>;
	export let onNext: () => Promise<any>;

	let hint: string | undefined;
	let translation: string | undefined;
	let isLoadingUnknown = false;
	let error: any;

	export let getHint: () => Promise<string>;
	export let getTranslation: () => Promise<string>;

	$: wordsWithSeparators = toWordsWithSeparators(sentence.sentence, language);

	function clear() {
		hint = undefined;
		translation = undefined;
	}

	$: if (sentence) {
		clear();
	}

	async function onClickedWord(wordString: string) {
		const timer = setTimeout(() => (isLoadingUnknown = true), 100);

		try {
			await new Promise((resolve) => setTimeout(resolve, 1000));

			await onUnknown(wordString);
		} catch (e) {
			console.error(e);

			error = e;
		} finally {
			clearTimeout(timer);
			isLoadingUnknown = false;
		}
	}
</script>

<div class="text-xs font-lato">
	Click any word you don't understand. This marks it for later repetition.
</div>

<div class="text-4xl mb-4 mt-2 font-medium">
	{#each wordsWithSeparators as word, index}{#if !isSeparator(word)}<span
				style="cursor: pointer"
				role="button"
				tabindex={index}
				class="hover:underline decoration-yellow"
				on:click={() => onClickedWord(word)}>{word}</span
			>{:else}{word}{/if}{/each}
</div>

{#if translation || hint}
	<div class="text-sm mb-6" in:slide>
		<div class="text-xs font-lato">
			{#if translation}
				The sentence means
			{:else}
				How the text might continue:
			{/if}
		</div>
		<div class="text-xl">"{translation || hint}"</div>
	</div>
{/if}

<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4">
	{#each revealed as word (word.id)}
		<WordCard
			{word}
			mnemonic={word.mnemonic}
			onRemove={() => onRemoveUnknown(word.word)}
			english={word.english}
			{knowledge}
		/>
	{/each}
	{#if isLoadingUnknown}
		<div class="flex justify-center items-center">
			<Spinner />
		</div>
	{/if}
</div>

<div class="flex gap-2 mt-4">
	{#if !hint && !translation}
		<SpinnerButton type="secondary" onClick={() => getHint().then((got) => (hint = got))}>
			Hint
		</SpinnerButton>
	{/if}

	{#if !translation}
		<SpinnerButton
			type="secondary"
			onClick={() => getTranslation().then((got) => (translation = got))}
		>
			Translation
		</SpinnerButton>
	{/if}

	<SpinnerButton onClick={onNext}>Got it</SpinnerButton>
</div>

<Ama
	ask={(question) =>
		fetchAskMeAnything({
			type: 'read',
			question,
			word: word?.word,
			sentence: sentence.sentence,
			revealed,
			translation
		})}
	wordId={sentence.id}
	suggestions={[
		'Can I express this differently?',
		'Why is it "this" and not "that"?',
		'How do you conjugate "to do"?',
		`How do you say "ice cream" in ${language.name}?`,
		...(revealed.length
			? ['Etymology?', 'Other meanings?', 'Similar-sounding words?', 'Synonyms?', 'Examples?']
			: [])
	]}
/>

<Error {error} onClear={() => (error = undefined)} />
