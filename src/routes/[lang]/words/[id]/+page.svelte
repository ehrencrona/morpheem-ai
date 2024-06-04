<script lang="ts">
	import { getLanguageOnClient } from '../../api/api-call';
	import type { PageData } from './$types';

	export let data: PageData;

	function formatDateTime(date: Date) {
		// e.g. May 1st, 12:30
		return date.toLocaleString('en-UK', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	const toPercent = (n: number) => `${(n * 100).toFixed(0)}%`;
</script>

<main>
	&lt; <a href="." class="underline text-sm">All words</a>
	<h1 class="text-xl font-bold my-4">{data.word?.word}</h1>

	<a
		href={`/${getLanguageOnClient().code}/words/${data.word.id}/delete`}
		class="block mb-4 text-sm text-red absolute right-0 top-0 px-3 py-1 border border-red rounded m-2"
	>
		Delete
	</a>

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
			<a href={`/${data.languageCode}/sentences/${sentence.id}`}>{sentence.sentence}</a>
		</p>
	{/each}

	{#if data.forms.length}
		<h2 class="font-bold mt-8 mb-2">Forms</h2>

		<ul class="flex flex-wrap gap-2">
			{#each data.forms as form}
				<li class="bg-blue-1 border-blue-1 rounded-lg px-5 py-1">
					{form.word}
					<a
						href={`/${getLanguageOnClient().code}/words/${data.word.id}/delete/lemma/${form.word}`}
						class="underline text-xs font-lato text-red ml-2">Delete</a
					>
				</li>
			{/each}
		</ul>
	{/if}

	<h2 class="font-bold mt-8 mb-2">Knowledge history</h2>

	{#if data.knowledgeLength > data.knowledgeHistory.length}
		<p class="text-xs font-sans mb-4">
			(skipped {data.knowledgeHistory.length - data.knowledgeLength} entries)
		</p>
	{/if}

	<div
		class="grid mb-2 gap-2 grid-cols-[2fr,1fr,1fr,1fr,1fr] md:grid-cols-[2fr,1fr,1fr,1fr,1fr,1fr]"
	>
		<div class="mb-1 text-xs font-sans flex-grow">Date</div>
		<div class="mb-1 text-xs font-sans">Knew</div>
		<div class="mb-1 text-xs font-sans">Exercise</div>
		<div class="mb-1 text-xs font-sans hidden md:block">Knowledge</div>
		<div class="mb-1 text-xs font-sans">Alpha</div>
		<div class="mb-1 text-xs font-sans">Beta</div>
		{#each data.knowledgeHistory as k}
			<div class="flex-grow">
				{formatDateTime(k.date)}
			</div>
			<div>
				{k.knew ? 'Yes' : 'No'}
			</div>
			<div>{k.exercise}</div>
			<div class="hidden md:block">
				{toPercent(k.knowledge)}
			</div>
			<div>
				{toPercent(k.alpha)}
			</div>
			<div>
				{k.beta ? toPercent(k.beta) : '-'}
			</div>
		{/each}
	</div>

	<p class="text-xs font-sans">
		Knowledge now {toPercent(data.readKnowledge)} (read), {toPercent(data.writeKnowledge)} (write)
	</p>

	<p class="text-xs font-sans">
		Repetition value: {toPercent(data.repetitionValueRead)} (read), {toPercent(data.repetitionValueWrite)} (write)
	</p>
</main>
