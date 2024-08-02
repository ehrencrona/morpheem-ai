<script lang="ts">
	import { goto } from '$app/navigation';
	import { getRepetitionTime } from '$lib/settings';
	import AdminUnitDialog from '../../../../components/AdminUnitDialog.svelte';
	import CloseSvg from '../../../../components/CloseSvg.svelte';
	import EditSvg from '../../../../components/EditSvg.svelte';
	import SpinnerButton from '../../../../components/SpinnerButton.svelte';
	import { calculateOptimalTime } from '../../../../logic/isomorphic/knowledge';
	import { getLanguageOnClient } from '../../api/api-call';
	import { callDeleteSentence } from '../../api/sentences/[sentence]/client';
	import { storeMergeWordWith } from '../../api/word/[id]/merge/client';
	import { fetchRelatedWords } from '../../api/word/[id]/related/client';
	import { sendWordUnit } from '../../api/word/[id]/unit/client';
	import type { PageData } from './$types';

	export let data: PageData;

	$: isAdmin = data.isAdmin;
	$: word = data.word;

	function formatDateTime(date: Date) {
		// e.g. May 1st, 12:30
		return date.toLocaleString('en-UK', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function deleteSentence(id: number) {
		await callDeleteSentence(id);
		data.sentences = data.sentences.filter((s) => s.id !== id);
	}

	async function loadRelated() {
		const res = await fetchRelatedWords(word.id);

		data.related = res;
	}

	const toPercent = (n: number) => `${(n * 100).toFixed(0)}%`;

	let isEditingUnit = false;

	let mergeWith: string;
</script>

<main>
	&lt; <a href="." class="underline text-sm">All words</a>
	<h1 class="text-xl font-bold my-4">{word.word}</h1>

	{#if data.isAdmin}
		<a
			href={`/${getLanguageOnClient().code}/words/${word.id}/delete`}
			class="block mb-4 text-sm text-red absolute right-0 top-0 px-3 py-1 border border-red rounded m-2"
		>
			Delete
		</a>
	{/if}

	<div class="my-4">
		<p><b>Level</b>: {word.level}%</p>
		<p><b>Type</b>: {word.type || '-'}</p>
		<p><b>Mnemonic</b>: {data.mnemonic || '-'}</p>
		<p>
			<b>Unit</b>: {#if word.unit}<a href="../units/{word.unit}" class="underline">#{word.unit}</a
				>{:else}-{/if}
			<button
				class="ml-2 w-5 h-5 hover:border-blue-3 border-2 border-white p-[2px] inline-block"
				on:click={() => (isEditingUnit = true)}
			>
				<EditSvg />
			</button>
		</p>
		{#if isAdmin}
			<div class="flex items-baseline gap-2">
				<div>Merge with</div>
				<input type="text" width="10" class="bg-blue-1 text-lg p-1" bind:value={mergeWith} />

				<SpinnerButton
					onClick={async () => {
						const res = await storeMergeWordWith(word.id, mergeWith.trim());

						mergeWith = '';

						goto(`/${getLanguageOnClient().code}/words/${res.toWordId}`);
					}}>Merge</SpinnerButton
				>
			</div>
		{/if}
	</div>

	{#if isEditingUnit}
		<AdminUnitDialog
			onCancel={() => (isEditingUnit = false)}
			save={async (unit) => {
				sendWordUnit(unit, word.id);
				word.unit = unit || undefined;
				isEditingUnit = false;
			}}
			unit={word.unit || null}
		/>
	{/if}

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

	<div class="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-2 gap-y-1">
		{#each data.sentences as sentence}
			<span class="text-xxs">
				#{sentence.id}
			</span>

			<a href="../sentences/{sentence.id}" class="pb-1 border-b-[1px] border-gray font-sans">
				{sentence.sentence}
			</a>

			<div>
				{#if isAdmin}
					<SpinnerButton className="ml-2 bg-red p-1" onClick={() => deleteSentence(sentence.id)}>
						<CloseSvg />
					</SpinnerButton>
				{/if}
			</div>
		{/each}
	</div>

	{#if data.forms.length}
		<h2 class="font-bold mt-8 mb-2">Forms</h2>

		<ul class="flex flex-wrap gap-2">
			{#each data.forms as form}
				<li class="bg-blue-1 border-blue-1 rounded-lg px-5 py-1">
					{form.word}
					{#if data.isAdmin}
						<a
							href={`/${getLanguageOnClient().code}/words/${word.id}/delete/lemma/${form.word}`}
							class="bg-red inline-block p-1 ml-1 relative top-[3px]"
						>
							<CloseSvg />
						</a>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	<h2 class="font-bold mt-8 mb-2">Related</h2>

	{#if data.related != undefined}
		{#if data.related.length}
			<ul class="flex flex-wrap gap-2">
				{#each data.related as related}
					<a href={related.id + ''} class="bg-blue-1 border-blue-1 rounded-lg px-5 py-1">
						{related.word}
					</a>
				{/each}
			</ul>
		{:else}
			<p>No related words.</p>
		{/if}
	{:else}
		<SpinnerButton onClick={loadRelated} className="underline">Load related</SpinnerButton>
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
		Optimal repetition time: after {calculateOptimalTime(data.readKnowledge, getRepetitionTime())} min
		(read),
		{calculateOptimalTime(data.writeKnowledge, getRepetitionTime())} min (write)
	</p>

	<p class="text-xs font-sans">
		Repetition value: {toPercent(data.repetitionValueRead)} (read), {toPercent(
			data.repetitionValueWrite
		)} (write)
	</p>
</main>
