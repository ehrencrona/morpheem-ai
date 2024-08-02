<script lang="ts">
	import AdminUnitDialog from '../../../../components/AdminUnitDialog.svelte';
	import EditSvg from '../../../../components/EditSvg.svelte';
	import SpinnerButton from '../../../../components/SpinnerButton.svelte';
	import { fetchTranslation } from '../../api/sentences/[sentence]/english/client';
	import { sendSentenceUnit } from '../../api/sentences/[sentence]/unit/client';
	import type { PageData } from './$types';

	export let data: PageData;

	$: sentence = data.sentence;

	async function translate() {
		sentence.english = (await fetchTranslation(sentence.id)).english;
	}

	let isEditingUnit = false;
</script>

<main>
	<div class="text-sm">#{sentence.id}</div>

	<div class="my-4">
		<p>
			<b>Unit</b>: {#if sentence.unit}<a href="../units/{sentence.unit}" class="underline"
					>#{sentence.unit}</a
				>{:else}-{/if}
			<button
				class="ml-2 w-5 h-5 hover:border-blue-3 border-2 border-white p-[2px] inline-block"
				on:click={() => (isEditingUnit = true)}
			>
				<EditSvg />
			</button>
		</p>
	</div>

	<h1 class="text-2xl mt-6 font-sans leading-snug">{sentence.sentence}</h1>

	{#if isEditingUnit}
		<AdminUnitDialog
			onCancel={() => (isEditingUnit = false)}
			save={async (unit) => {
				sendSentenceUnit(unit, sentence.id);
				sentence.unit = unit || undefined;
				isEditingUnit = false;
			}}
			unit={sentence.unit || null}
		/>
	{/if}

	{#if sentence.english}
		<p class="mt-6"><i>{sentence.english}</i></p>
	{:else}
		<SpinnerButton onClick={translate} type="secondary" className="underline">Translate</SpinnerButton>
	{/if}

	<ul class="flex gap-2 mt-8">
		{#each data.lemmas as word}
			<li class="bg-blue-1 px-4 py-2">
				<a href={`/${data.languageCode}/words/${word.id}`}>{word.word}</a>

				<div class="text-xxs mt-1">
					{#if word.unit}
						<a href={`/${data.languageCode}/units/${word.unit}`}>
							unit {word.unit}
						</a>
					{/if}

					level {word.level}%
				</div>
			</li>
		{/each}
	</ul>

	{#if data.isAdmin}
		<a
			href={`/${data.languageCode}/sentences/${sentence.id}/delete`}
			class="bg-red text-white rounded-md py-2 px-8 md:px-6 md:py-1 m-2 ml-0 text-base whitespace-nowrap mt-8 inline-block"
		>
			Delete
		</a>
	{/if}
</main>
