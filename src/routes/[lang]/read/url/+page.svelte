<script lang="ts">
	import { dedupUnknown } from '$lib/dedupUnknown';
	import { logError } from '$lib/logError';
	import { slide } from 'svelte/transition';
	import ErrorMessage from '../../../../components/ErrorMessage.svelte';
	import Spinner from '../../../../components/Spinner.svelte';
	import SpinnerButton from '../../../../components/SpinnerButton.svelte';
	import { isSeparator, toWordsWithSeparators } from '../../../../logic/toWords';
	import { fetchSimplified } from '../../api/read/simplify/client';
	import { sendReadText } from '../../api/read/text/client';
	import { fetchTranslation } from '../../api/read/translate/client';
	import type { UnknownWordResponse } from '../../api/word/unknown/+server';
	import { lookupUnknownWord } from '../../api/word/unknown/client';
	import Ama from '../../learn/AMA.svelte';
	import WordCard from '../../learn/WordCard.svelte';
	import { trackActivity } from '../../learn/trackActivity';
	import type { PageData } from './$types';
	import { fetchAskMeAnything } from '../../api/write/ama/client';

	export let data: PageData;

	let isLookingUpUnknown = false;
	let showedParagraphAt = Date.now();

	let translation: Awaited<ReturnType<typeof fetchTranslation>> | undefined;

	$: paragraphs = data.paragraphs;
	$: language = data.language;

	let atParagraph = 0;
	let revealed: UnknownWordResponse[] = [];

	async function onParagraphDone() {
		let timeSpent = Math.round((Date.now() - showedParagraphAt) / 1000);

		const wordsPerSecond = 2;

		if (timeSpent > words.length / 2 / wordsPerSecond) {
			console.warn(`User spent ${timeSpent} seconds reading ${words.length} words.`);

			sendReadText(
				paragraphs[atParagraph],
				revealed.map(({ id }) => id)
			).catch(logError);
		} else {
			console.warn(
				`User spent only ${timeSpent} seconds reading ${words.length} words. Assuming skipped.`
			);
		}

		showedParagraphAt = Date.now();
		translation = undefined;
	}

	async function nextParagraph() {
		onParagraphDone();

		atParagraph = atParagraph === paragraphs.length - 1 ? 0 : atParagraph + 1;
		revealed = [];
	}

	async function done() {
		onParagraphDone();
	}

	$: words = toWordsWithSeparators(paragraphs[atParagraph], language);

	async function onClickedWord(word: string) {
		try {
			isLookingUpUnknown = true;

			const unknownWord = await lookupUnknownWord(word, undefined);

			revealed = dedupUnknown([...revealed, unknownWord]);
		} catch (e) {
			logError(e);
		} finally {
			isLookingUpUnknown = false;
		}
	}

	async function onRemoveUnknown(word: string) {
		revealed = revealed.filter((r) => r.word !== word);
	}

	async function simplify() {
		const simplified = await fetchSimplified(paragraphs[atParagraph]);

		paragraphs = paragraphs.map((p, i) => (i === atParagraph ? simplified : p));

		if (translation) {
			await translate();
		}
	}

	async function translate() {
		translation = await fetchTranslation(paragraphs[atParagraph]);
	}
</script>

<main use:trackActivity>
	<h1 class="text-4xl mb-8 mt-4 leading-tight font-bold">{data.title}</h1>

	<div class="text-xs mb-4">Paragraph {atParagraph + 1} / {paragraphs.length}</div>

	<div class="grid grid-flow-row{translation ? ` md:grid-cols-2` : ''} items-start gap-4">
		<div class="text-xl mb-4 mt-2 font-medium">
			{#each words as word, index}{#if !isSeparator(word)}<span
						style="cursor: pointer"
						role="button"
						tabindex={index}
						class={revealed.find((r) => (r.inflected || r.word) == word)
							? 'border-b-2 border-blue-3 border-dotted'
							: 'hover:underline decoration-yellow'}
						on:click={() => onClickedWord(word)}>{word}</span
					>{:else}{word}{/if}{/each}
		</div>

		{#if translation}
			<div class="text-sm mb-6 mt-2" in:slide>
				<div class="text-xs font-lato block md:hidden mb-1">The sentence means</div>
				<div class="text-base">"{translation.translation}"</div>

				{#if translation.transliteration}
					<div class="text-xs font-lato">
						{translation.transliteration}
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4">
		{#each revealed as word (word.id)}
			<WordCard {word} onRemove={() => onRemoveUnknown(word.word)} />
		{/each}

		{#if isLookingUpUnknown}
			<div class="flex justify-center items-center">
				<Spinner />
			</div>
		{/if}
	</div>

	<div class="flex flex-wrap gap-4 mt-4">
		{#if atParagraph < paragraphs.length - 1}
			<SpinnerButton onClick={nextParagraph}>Next</SpinnerButton>
		{:else}
			<SpinnerButton onClick={done}>Done reading</SpinnerButton>
		{/if}
		<SpinnerButton onClick={translate} type="secondary">Translate</SpinnerButton>
		<SpinnerButton onClick={simplify} type="secondary">Simplify</SpinnerButton>
	</div>

	<ErrorMessage />

	<Ama
		ask={(question) =>
			fetchAskMeAnything({
				exercise: 'read',
				question,
				sentence: paragraphs[atParagraph],
				revealed,
				translation: translation?.translation
			})}
		wordId={atParagraph}
		suggestions={[
			'Summarize the text',
			'What does the word "..." mean in this context?',
			...(revealed.length
				? ['Etymology?', 'Other meanings?', 'Similar-sounding words?', 'Synonyms?', 'Examples?']
				: [])
		]}
	/>
</main>
