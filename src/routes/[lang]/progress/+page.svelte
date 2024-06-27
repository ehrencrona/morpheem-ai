<script lang="ts">
	import Plot from 'svelte-plotly.js';
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

	const readData = data.activity
		.map(({ words_known }, i) => ({ day: data.activity.length - 1 - i, y: words_known }))
		.filter(({ y }) => y > 0);

	let readTrace = {
		x: readData.map(({ day }) => day),
		y: readData.map(({ y }) => y),
		type: 'scatter',
	};

	const writeData = data.activity
		.map(({ words_known_write }, i) => ({
			day: data.activity.length - 1 - i,
			y: words_known_write
		}))
		.filter(({ y }) => y > 0);

	let writeTrace = {
		x: writeData.map(({ day }) => day),
		y: writeData.map(({ y }) => y),
		type: 'scatter',
	};

	const timeData = data.activity
		.map(({ minutes_spent }, i) => ({ day: data.activity.length - 1 - i, y: minutes_spent }))
		.filter(({ y }) => !!y);

	let timeTrace = {
		x: timeData.map(({ day }) => day),
		y: timeData.map(({ y }) => y),
		type: 'scatter',
		name: 'Time spent'
	};
</script>

<h1 class="text-2xl mb-8 mt-8">Your Progress</h1>

<div class="flex flex-wrap mb-8">
	{#if readTrace.x.length > 2 || writeTrace.x.length > 2}
		<div class="h-[200px] min-w-[300px] flex-1">
			<div class="text-center text-xs font-lato">Vocabulary</div>
			<Plot
				data={[readTrace, writeTrace]}
				config={{ displayModeBar: false }}
				layout={{
					margin: { t: 0, l: 40, b: 20, r: 10 },
					font: {
						size: 10
					},
					showlegend: false
				}}
				fillParent={true}
				debounce={100}
			/>
		</div>
	{/if}

	{#if timeTrace.x.length > 2}
		<div class="h-[200px] min-w-[300px] flex-1">
			<div class="text-center text-xs font-lato">Minutes per day</div>
			<Plot
				data={[timeTrace]}
				config={{ displayModeBar: false }}
				layout={{
					margin: { t: 0, l: 40, b: 20, r: 10 },
					font: {
						size: 10
					}
				}}
				fillParent={true}
				debounce={100}
			/>
		</div>
	{/if}
</div>

<div class="mt-16 grid grid-cols-5 gap-h-1 max-w-[700px] text-xs w-full font-lato">
	<div class="col-span-3"></div>
	<div class="col-span-2 text-right">Vocabulary size</div>
	<div class="pb-1 border-b border-blue-2">Date</div>
	<div class="pb-1 text-right border-b border-blue-2">Time spent</div>
	<div class="pb-1 text-right border-b border-blue-2">Sentences</div>
	<div class="pb-1 text-right border-b border-blue-2">Passive</div>
	<div class="pb-1 text-right border-b border-blue-2">Active</div>
	{#each data.activity.slice(0, 10) as date}
		<div class="pt-1 border-r border-blue-2">
			{dateFormat.format(date.date)}
		</div>
		<div class="pt-1 text-right">
			{date.minutes_spent} min
		</div>
		<div class="pt-1 text-right">
			{date.sentences_done}
		</div>
		<div class="pt-1 text-right">
			{formatNumber(date.words_known)} <span class="hidden md:inline">words</span>
		</div>
		<div class="pt-1 text-right">
			{formatNumber(date.words_known_write)} <span class="hidden md:inline">words</span>
		</div>
	{/each}
</div>
