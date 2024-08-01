<script lang="ts">
	import { logError } from '$lib/logError';
	import { slide } from 'svelte/transition';
	import Spinner from '../../../components/Spinner.svelte';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import type * as DB from '../../../db/types';
	import { isSeparator, toWordsWithSeparators } from '../../../logic/toWordStrings';
	import type { Language } from '../../../logic/types';
	import type { Translation } from '../api/sentences/[sentence]/english/client';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { fetchAskMeAnything } from '../api/write/ama/client';
	import Ama from './AMA.svelte';
	import WordCard from './WordCard.svelte';
	import { getShowTransliteration } from '$lib/settings';

	export let sentence: DB.Sentence;
	export let word: DB.Word | undefined;
	export let language: Language;

	export let unknown: UnknownWordResponse[];

	export let onUnknown: (word: string) => Promise<any>;
	export let onRemoveUnknown: (word: string) => Promise<any>;
	export let onNext: () => Promise<any>;

	let translation: Translation | undefined;
	let isLoadingUnknown = false;

	export let getTranslation: () => Promise<Translation>;

	$: wordsWithSeparators = toWordsWithSeparators(sentence.sentence, language);

	function clear() {
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
			logError(e);
		} finally {
			clearTimeout(timer);
			isLoadingUnknown = false;
		}
	}

	let showTransliteration = getShowTransliteration();
</script>

<div class="text-xs font-lato">
	Read the sentence and click any word you don't understand. This marks them for later repetition.
</div>

<div class="font-sans text-3xl lg:text-4xl mb-4 mt-2 font-medium leading-snug">
	{#each wordsWithSeparators as word, index}{#if !isSeparator(word)}<span
				style="cursor: pointer"
				role="button"
				tabindex={index}
				class={unknown.find((r) => (r.inflected || r.word) == word)
					? 'border-b-2 border-blue-3 border-dotted'
					: 'hover:underline decoration-yellow'}
				on:click={() => onClickedWord(word)}>{word}</span
			>{:else}{word}{/if}{/each}
</div>

{#if translation}
	<div class="text-sm mb-6" in:slide>
		<div class="text-xs font-lato">
			{#if translation}
				The sentence means
			{:else}
				How the text might continue:
			{/if}
		</div>
		<div class="text-xl">"{translation.english}"</div>
		{#if translation?.transliteration && showTransliteration}
			<div class="text-xs font-lato">
				{translation.transliteration}
			</div>
		{/if}
	</div>
{/if}

<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4">
	{#each unknown as word (word.id)}
		<WordCard {word} onRemove={() => onRemoveUnknown(word.word)} />
	{/each}
	{#if isLoadingUnknown}
		<div class="flex justify-center items-center">
			<Spinner />
		</div>
	{/if}
</div>

<div class="flex flex-wrap gap-2 mt-4">
	{#if !translation}
		<SpinnerButton
			type="secondary"
			onClick={() => getTranslation().then((got) => (translation = got))}
		>
			Translation
		</SpinnerButton>
	{/if}

	<SpinnerButton onClick={onNext} grabFocus={true}>Continue</SpinnerButton>
</div>

<Ama
	ask={(question) =>
		fetchAskMeAnything({
			exercise: 'read',
			question,
			word: word?.word,
			sentence: sentence.sentence,
			unknown,
			translation: translation?.english
		})}
	wordId={sentence.id}
	suggestions={[
		'Can I express this differently?',
		`What is the etymology of "${wordsWithSeparators.filter((w) => !isSeparator(w))?.[1]}"?`,
		'Break down this sentence for me',
		'How do you conjugate "to do"?',
		`How do you say "ice cream" in ${language.name}?`,
		...(unknown.length
			? ['Etymology?', 'Other meanings?', 'Similar-sounding words?', 'Synonyms?', 'Examples?']
			: [])
	]}
/>
