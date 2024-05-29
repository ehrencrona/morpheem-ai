<script lang="ts">
	import { goto } from '$app/navigation';
	import { getLanguageOnClient } from '../api/api-call';
	import ReadSentence from '../learn/ReadSentence.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let sentenceIndex = 0;

	$: sentence = data.sentences[sentenceIndex];

	const onNext = async () => {
		sentenceIndex++;

		if (sentenceIndex >= data.sentences.length) {
			goto(`test/result`);
		}
	};
</script>

<h1 class="text-base">Sentence {sentenceIndex + 1} / {data.sentences.length}</h1>

<ReadSentence
	sentence={sentence.sentence}
	words={sentence.words}
	word={undefined}
	language={getLanguageOnClient()}
	{onNext}
/>
