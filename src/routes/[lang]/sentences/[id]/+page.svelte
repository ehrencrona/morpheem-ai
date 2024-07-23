<script lang="ts">
	import { sendSentenceUnit } from '../../api/sentences/[sentence]/unit/client';
	import type { PageData } from './$types';

	export let data: PageData;

	$: sentence = data.sentence;
</script>

<main>
	<div class="text-sm">#{sentence.id}</div>

	<h1 class="text-xl my-2">{sentence.sentence}</h1>

	{#if sentence.english}
		<p><i>{sentence.english}</i></p>
	{/if}

	<ul class="flex gap-2 mt-8">
		{#each data.lemmas as word}
			<li class="bg-blue-1 px-4 py-2">
				<a href={`/${data.languageCode}/words/${word.id}`}>{word.word}</a>
			</li>
		{/each}
	</ul>

	<a
		href={`/${data.languageCode}/sentences/${sentence.id}/delete`}
		class="bg-red text-white rounded-md py-2 px-8 md:px-6 md:py-1 m-2 ml-0 text-base whitespace-nowrap mt-8 inline-block"
	>
		Delete
	</a>
</main>
