<script lang="ts">
	import type { load } from './+page.server';

	export let data: Awaited<ReturnType<typeof load>>;
</script>

<main>
	<h1>{data.sentence.sentence}</h1>

	{#if data.sentence.english}
		<p><i>{data.sentence.english}</i></p>
	{/if}

	<ul>
		{#each data.lemmas as word}
			<li>
				<a href="/words/{word.id}">{word.word}</a>
			</li>
		{/each}
	</ul>

	<a href="/sentences/{data.sentence.id}/delete">delete</a>
</main>
