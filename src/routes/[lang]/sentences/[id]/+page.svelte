<script lang="ts">
	import type { PageData } from './$types';
	
	export let data: PageData;
</script>

<main>
	<h1 class="text-xl my-8">{data.sentence.sentence}</h1>

	{#if data.sentence.english}
		<p><i>{data.sentence.english}</i></p>
	{/if}

	<ul class="flex gap-2">
		{#each data.lemmas as word}
			<li class="bg-blue-1 p-4">
				<a href={`/${data.languageCode}/words/${word.id}`}>{word.word}</a>
			</li>
		{/each}
	</ul>

	<a href={`/${data.languageCode}/sentences/{data.sentence.id}/delete`} class="block text-red my-8">delete</a>
</main>
