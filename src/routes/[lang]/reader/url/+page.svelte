<script lang="ts">
	import { dedupUnknown } from '$lib/dedupUnknown';
	import { logError } from '$lib/logError';
	import { getShowTransliteration } from '$lib/settings';
	import { slide } from 'svelte/transition';
	import Spinner from '../../../../components/Spinner.svelte';
	import SpinnerButton from '../../../../components/SpinnerButton.svelte';
	import Tutorial from '../../../../components/Tutorial.svelte';
	import { toWordStrings } from '../../../../logic/toWordStrings';
	import { fetchSimplified } from '../../api/read/simplify/client';
	import { sendReadText } from '../../api/read/text/client';
	import { fetchTranslation } from '../../api/read/translate/client';
	import type { UnknownWordResponse } from '../../api/word/unknown/+server';
	import { lookupUnknownWord } from '../../api/word/unknown/client';
	import { fetchAskMeAnything } from '../../api/write/ama/client';
	import Ama from '../../learn/AMA.svelte';
	import WordCard from '../../learn/WordCard.svelte';
	import { trackActivity } from '../../learn/trackActivity';
	import type { PageData } from './$types';
	import ParagraphComponent from './Paragraph.svelte';
	import { onMount } from 'svelte';
	import { addToReaderHistory } from '../history';
	import { goto } from '$app/navigation';

	export let data: PageData;

	onMount(() => {
		function formatDate(date: string) {
			return new Date(date).toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'short'
			});
		}

		addToReaderHistory({
			url: data.articleUrl,
			title: data.title || data.articleUrl,
			date: formatDate(new Date().toISOString())
		});
	});

	let isLookingUpUnknown = false;
	let showedParagraphAt = Date.now();

	let translatedTitle: Awaited<ReturnType<typeof fetchTranslation>> | undefined;

	let translatedParagraphs: Awaited<ReturnType<typeof fetchTranslation>>[] | undefined;

	$: pages = data.pages;
	$: language = data.language;

	let atPage = data.atPage;

	$: page = pages[atPage];
	let unknown: UnknownWordResponse[] = [];

	let showTransliteration = getShowTransliteration();

	async function onParagraphDone() {
		let timeSpent = Math.round((Date.now() - showedParagraphAt) / 1000);

		const wordsPerSecond = 2;

		const wordCount = page.reduce((acc, { text }) => acc + toWordStrings(text, language).length, 0);

		if (timeSpent > wordCount / wordsPerSecond) {
			console.warn(`User spent ${timeSpent} seconds reading ${wordCount} words.`);

			sendReadText(
				(
					(atPage == 0 ? data.title : '') +
					' ' +
					pages[atPage].reduce((acc, { text }) => acc + ' ' + text, '')
				).trim(),
				unknown.map(({ id }) => id)
			).catch(logError);
		} else {
			console.warn(
				`User spent only ${timeSpent} seconds reading ${wordCount} words. Assuming skipped.`
			);
		}

		showedParagraphAt = Date.now();
		translatedParagraphs = undefined;
	}

	async function nextPage() {
		onParagraphDone();

		atPage = atPage === pages.length - 1 ? 0 : atPage + 1;
		unknown = [];

		const searchParams = new URLSearchParams(location.search);
		searchParams.set('page', atPage + 1 + '');

		history.pushState(null, '', `?${searchParams.toString()}`);
	}

	async function done() {
		await onParagraphDone();

		goto(`/${language.code}/reader`);
	}

	async function onClickedWord(word: string) {
		try {
			isLookingUpUnknown = true;

			const unknownWord = await lookupUnknownWord(word, undefined);

			unknown = dedupUnknown([...unknown, unknownWord]);
		} catch (e) {
			logError(e);
		} finally {
			isLookingUpUnknown = false;
		}
	}

	async function onRemoveUnknown(word: string) {
		unknown = unknown.filter((r) => r.word !== word);
	}

	async function simplify() {
		const simplified = await Promise.all(page.map((p) => fetchSimplified(p.text)));

		pages = pages.map((page, i) =>
			i === atPage
				? page.map((paragraph, i) => ({ style: paragraph.style, text: simplified[i] }))
				: page
		);

		if (translatedParagraphs) {
			await translate();
		}
	}

	async function translate() {
		await Promise.all([
			(async () =>
				(translatedParagraphs = await Promise.all(page.map((p) => fetchTranslation(p.text)))))(),
			(async () => {
				if (!translatedTitle && data.title) {
					translatedTitle = await fetchTranslation(data.title);
				}
			})()
		]);
	}
</script>

<main use:trackActivity>
	<h3 class="mt-4 mb-2">
		<a
			href={data.articleUrl}
			class="text-blue-3 underline text-xs"
			target="_blank"
			rel="noopener noreferrer"
			>{new URL(data.articleUrl).host}
			<svg class="w-3 h-3 inline-block ml-[2px]" viewBox="0 0 24 24" fill="none"
				><path
					d="M10 5H8.2c-1.12 0-1.68 0-2.108.218a1.999 1.999 0 0 0-.874.874C5 6.52 5 7.08 5 8.2v7.6c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874c.427.218.987.218 2.105.218h7.606c1.118 0 1.677 0 2.104-.218.377-.192.683-.498.875-.874.218-.428.218-.987.218-2.105V14m1-5V4m0 0h-5m5 0-7 7"
					stroke="#1D3557"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</a>
	</h3>

	<div class="grid grid-flow-row{translatedTitle ? ` md:grid-cols-2` : ''} items-start gap-8">
		<h1 class="text-3xl lg:text-4xl mb-4 leading-tight font-bold">
			<ParagraphComponent text={data.title || ''} {language} {unknown} {onClickedWord} />

			{#if translatedTitle?.transliteration && showTransliteration}
				<div class="text-xs font-lato mt-2">{translatedTitle.transliteration}</div>
			{/if}
		</h1>

		{#if translatedTitle}
			<h1 class="text-2xl mb-4 leading-tight font-bold">
				{translatedTitle.translation}
			</h1>
		{/if}
	</div>

	<div class="w-full h-[3px] bg-blue-2 mb-8">
		<div
			class="h-full bg-blue-4"
			style={`width: ${Math.round((100 * (atPage + 1)) / pages.length)}%`}
		></div>
	</div>

	<div
		class="grid grid-flow-row{translatedParagraphs?.length
			? ` md:grid-cols-2`
			: ''} items-start gap-8"
	>
		<div class="text-xl mb-4 mt-2 font-medium flex flex-col gap-4">
			{#each page as paragraph, index}
				<div class={paragraph.style == 'h' ? 'font-bold' : ''}>
					<ParagraphComponent text={paragraph.text} {language} {unknown} {onClickedWord} />

					{#if translatedParagraphs?.[index].transliteration && showTransliteration}
						<div class="text-xs font-lato mt-2">
							{translatedParagraphs[index].transliteration}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		{#if translatedParagraphs?.length}
			<div class="text-sm mb-6 mt-2" in:slide>
				<div class="text-xs font-lato block md:hidden mb-1">The paragraph means</div>

				<div class="flex flex-col gap-4">
					{#each translatedParagraphs as translated}
						<div class="text-base">{translated.translation}</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4">
		{#each unknown as word (word.id)}
			<WordCard {word} onRemove={() => onRemoveUnknown(word.word)} />
		{/each}

		{#if isLookingUpUnknown}
			<div class="flex justify-center items-center">
				<Spinner />
			</div>
		{/if}
	</div>

	<div class="flex flex-wrap gap-4 mt-4">
		{#if atPage < pages.length - 1}
			<SpinnerButton onClick={nextPage}>Next</SpinnerButton>
		{:else}
			<SpinnerButton onClick={done}>Done reading</SpinnerButton>
		{/if}
		{#if !translatedParagraphs}
			<SpinnerButton onClick={translate} type="secondary">Translate</SpinnerButton>
		{/if}
		<SpinnerButton onClick={simplify} type="secondary">Simplify</SpinnerButton>
	</div>

	<Tutorial
		id="reader"
		paragraphs={[
			"Click on words you don't know to reveal their meaning.",
			'Pressing next will mark that you know all other words in the paragraph.'
		]}
	/>

	<Ama
		ask={(question) =>
			fetchAskMeAnything({
				exercise: 'read',
				question,
				sentence: pages[atPage].reduce((acc, { text }) => acc + ' ' + text, '').trim(),
				unknown,
				translation: translatedParagraphs
					?.reduce((acc, { translation }) => acc + ' ' + translation, '')
					.trim()
			})}
		wordId={atPage}
		suggestions={[
			'Summarize the text',
			'What does the word "..." mean in this context?',
			...(unknown.length
				? ['Etymology?', 'Other meanings?', 'Similar-sounding words?', 'Synonyms?', 'Examples?']
				: [])
		]}
	/>
</main>
