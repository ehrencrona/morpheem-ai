<script lang="ts">
	import { getLanguageOnClient } from '../api/api-call';
	import type { PageData } from './$types';
	import RecentSentences from './RecentSentences.svelte';
	import RecentWords from './RecentWords.svelte';

	export let data: PageData;

	const dateFormat = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric'
	});

	function formatNumber(n: number) {
		return n.toLocaleString('en-US');
	}
</script>

<a href="/{getLanguageOnClient()}" class="inline-block mt-2 bg-blue-3 text-blue-1 rounded-md px-4 py-3">
	Keep studying
</a>

<h3 class="text-lg mb-4 mt-8">Your progress</h3>

<div class="grid grid-cols-5 gap-h-1 max-w-[500px] text-xs">
	<div class="col-span-3"></div>
	<div class="col-span-2 text-right">Vocabulary size</div>
	<div class="mb-2">Date</div>
	<div class="mb-2 text-right ">Time spent</div>
	<div class="mb-2 text-right">Sentences</div>
	<div class="mb-2 text-right">Passive</div>
	<div class="mb-2 text-right">Active</div>
	{#each data.activity as date}
		<div class="mb-1">
			{dateFormat.format(date.date)}
		</div>
		<div class="mb-1 text-right">
			{date.minutes_spent} min
		</div>
		<div class="mb-1 text-right">
			{date.sentences_done}
		</div>
		<div class="mb-1 text-right">
			{formatNumber(date.words_known)} <span class="hidden md:inline">words</span>
		</div>
		<div class="mb-1 text-right">
			{formatNumber(date.words_known_write)} <span class="hidden md:inline">words</span>
		</div>
	{/each}
</div>

<h3 class="text-lg mb-4 mt-8">Sentences written</h3>

<RecentSentences sentences={data.writtenSentences} />

<h3 class="text-lg mb-4 mt-8">Recent words</h3>

<RecentWords knowledge={data.knowledge} />
