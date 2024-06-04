<script lang="ts">
	import {
		getPastDue,
		getRepetitionTime,
		setPastDue,
		setRepetitionTime
	} from '$lib/settings';
	import { onMount } from 'svelte';
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

	let repetitionTime = 0;
	let pastDue = 0;

	onMount(() => {
		repetitionTime = getRepetitionTime();
		pastDue = getPastDue();
	});
</script>

<a
	href="/{getLanguageOnClient().code}"
	class="inline-block mt-2 bg-blue-3 text-blue-1 rounded-md px-4 py-3"
>
	Keep studying
</a>

<h3 class="text-lg mb-4 mt-8">Settings</h3>

<div class="grid grid-cols-3 gap-2 items-center">
	<div>More repetition</div>
	<ul class="flex flex-1 justify-center pt-1">
		{#each [-2, -1, 0, 1, 2] as i}
			<li>
				{#if pastDue == i}
					<div class="inline-block w-4 h-4 rounded-full bg-blue-4 border border-blue-4 mr-2"></div>
				{:else}
					<button
						type="button"
						on:click={() => {
							setPastDue(i);
							pastDue = i;
						}}
					>
						<div
							class="inline-block w-4 h-4 rounded-full bg-blue-1 border border-blue-4 mr-2"
						></div>
					</button>
				{/if}
			</li>
		{/each}
	</ul>
	<div class="text-right">More new words</div>

	<div>Rehearse early</div>
	<ul class="flex flex-1 justify-center pt-1">
		{#each [-2, -1, 0, 1, 2] as i}
			<li>
				{#if repetitionTime == i}
					<div class="inline-block w-4 h-4 rounded-full bg-blue-4 border border-blue-4 mr-2"></div>
				{:else}
					<button
						type="button"
						on:click={() => {
							setRepetitionTime(i);
							repetitionTime = i;
						}}
					>
						<div
							class="inline-block w-4 h-4 rounded-full bg-blue-1 border border-blue-4 mr-2"
						></div>
					</button>
				{/if}
			</li>
		{/each}
	</ul>
	<div class="text-right">Rehearse late</div>
</div>

<h3 class="text-lg mb-4 mt-8">Your progress</h3>

<div class="grid grid-cols-5 gap-h-1 max-w-[500px] text-xs">
	<div class="col-span-3"></div>
	<div class="col-span-2 text-right">Vocabulary size</div>
	<div class="mb-2">Date</div>
	<div class="mb-2 text-right">Time spent</div>
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
