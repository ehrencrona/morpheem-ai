<script lang="ts">
	import { formatMinutes } from '$lib/formatMinutes';
	import CopySvg from '../../../components/CopySvg.svelte';
	import type * as DB from '../../../db/types';
	import { getLanguageOnClient } from '../api/api-call';
	import type { PageData } from './$types';
	import WriteSentence from './WriteSentence.svelte';
	import { slide } from 'svelte/transition';

	export let data: PageData;

	let sentences: { id: number; sentence: string; time: Date }[] = data.sentences || [];

	async function addSentence(sentence: DB.Sentence) {
		sentences = [{ ...sentence, time: new Date() }, ...sentences];
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}
</script>

<h1 class="text-2xl font-sans font-bold mb-6 mt-8">Writer</h1>

<p class="mb-2 text-sm font-lato">
	Practise writing whatever you want. Any mistakes you made will be corrected and feed into your
	exercises.
</p>

<p class="mb-8 text-sm font-lato">
	Use this whenever you need write something in {getLanguageOnClient().name} and then copy / paste the
	text. It saves you switching to a translation app and you get to practise your mistakes.
</p>

<WriteSentence onDone={addSentence} />

<ul class="mt-8">
	{#each sentences as sentence, i (sentence.id)}
		<li class="mb-4 text-balance border-l-4 border-blue-3 pl-3" transition:slide>
			{sentence.sentence}

			{#if i < 3}
				<button
					on:click={() => copyToClipboard(sentence.sentence)}
					class="w-5 h-5 hover:border-blue-3 border-2 border-white p-[2px] inline-block
				"
				>
					<CopySvg />
				</button>
			{/if}

			<div class="text-xs text-gray-1 mt-[2px]">
				{formatMinutes((Date.now() - sentence.time.getTime()) / 60000)} ago
			</div>
		</li>
	{/each}
</ul>
