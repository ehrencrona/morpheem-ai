<script lang="ts">
	import type { load } from './+page.server';

	export let data: Awaited<ReturnType<typeof load>>;
</script>

<main>
	<h1>{data.sentence.sentence}</h1>

	<p><i>{data.sentence.english}</i></p>

	<ul>
		{#each data.lemmas as word}
			<li>
				<a href="/words/{word.id}">{word.word}</a>
			</li>
		{/each}
	</ul>
</main>
