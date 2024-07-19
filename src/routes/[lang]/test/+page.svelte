<script lang="ts">
	import { goto } from '$app/navigation';
	import { getLanguageOnClient } from '../api/api-call';
	import ReadSentence from '../learn/ReadSentence.svelte';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import type { PageData } from './$types';
	import { sendKnowledge } from '../api/knowledge/client';
	import { trackActivity } from '../learn/trackActivity';

	export let data: PageData;

	let sentenceIndex = -1;

	$: sentence = data.sentences[Math.max(sentenceIndex, 0)];

	const onNext = async () => {
		if (sentenceIndex >= data.sentences.length - 1) {
			await goto(`test/done`);
		} else {
			sentenceIndex++;
		}
	};
</script>

{#if sentenceIndex == -1}
	<h1 class="text-2xl font-sans font-bold mt-12 mb-8">1. Reading comprehension</h1>

	<div class="max-w-[600px]">
		<p class="mb-4">
			You will get a sequence of sentences. Click any word that you don't understand to open a
			translation.
		</p>

		<p class="mb-4">Open words will be marked as unknown. Remaining words are marked as known.</p>

		<p class="mb-4">At the end, you will get an estimate of your passive vocabulary size.</p>

		<p class="mb-4">
			Don't be discouraged if the sentences are too hard. After the test the exercises will adapt to
			your level.
		</p>
	</div>

	<div class="mt-8">
		<SpinnerButton onClick={onNext}>Start</SpinnerButton>
	</div>
{:else}
	<h1 class="text-base" use:trackActivity>Sentence {sentenceIndex + 1} / {data.sentences.length}</h1>

	<ReadSentence
		{sendKnowledge}
		sentence={sentence.sentence}
		words={sentence.words}
		word={undefined}
		language={getLanguageOnClient()}
		{onNext}
	/>
{/if}
