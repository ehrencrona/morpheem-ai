<script lang="ts">
	import type { load } from './+page.server';

	export let data: Awaited<ReturnType<typeof load>>;

	const dateFormat = new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric'
	});

	const toPercent = (n: number) => `${(n * 100).toFixed(2)}%`;
</script>

<main>
	<h1 class="text-xl font-bold my-4">{data.word?.word}</h1>

	<a href="/words/{data.word.id}/delete" class="underline block mb-4 text-red">delete</a>

	<div class="my-4">
		<p><b>Level</b>: {data.word.level}%</p>
		<p><b>Cognate</b>: {data.word.cognate}</p>
		<p><b>Mnemonic</b>: {data.mnemonic || '-'}</p>
	</div>

	{#if data.translations.length}
		<h2 class="font-bold mt-8 mb-2">Translations</h2>

		<ul>
			{#each data.translations as translation}
				<li class="my-1">
					{translation}
				</li>
			{/each}
		</ul>
	{/if}

	<h2 class="font-bold mt-8 mb-2">Sentences</h2>

	{#each data.sentences as sentence}
		<p class="my-1">
			<a href="/sentences/{sentence.id}">{sentence.sentence}</a>
		</p>
	{/each}

	{#if data.forms.length}
		<h2 class="font-bold mt-8 mb-2">Forms</h2>

		<ul class="flex gap-2">
			{#each data.forms as form}
				<li class="bg-blue-1 border-blue-1 rounded-lg px-5 py-1">
					{form.word}
					<a
						href={`/words/${data.word.id}/delete/lemma/${form.word}`}
						class="underline text-xs font-lato text-red ml-2">Delete</a
					>
				</li>
			{/each}
		</ul>
	{/if}

	<h2 class="font-bold mt-8 mb-2">Knowledge history</h2>

	<div class="grid grid-cols-4 mb-2">
		<div class="mb-1">Date</div>
		<div class="mb-1">Knew</div>
		<div class="mb-1">Knowledge</div>
		<div class="mb-1">Alpha</div>
		{#each data.knowledgeHistory as k}
			<div>
				{dateFormat.format(k.date)}
			</div>
			<div>
				{k.knew ? 'Knew' : "Didn't know"}
			</div>
			<div>
				{toPercent(k.knowledge)}
			</div>
			<div>
				{toPercent(k.alpha)}
			</div>
		{/each}
	</div>

	<p>Knowledge now: {toPercent(data.wordKnowledge)}</p>
</main>
