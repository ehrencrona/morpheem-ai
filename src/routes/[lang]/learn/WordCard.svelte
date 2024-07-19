<script lang="ts">
	import type * as DB from '../../../db/types';
	import { fetchMnemonic, storeMnemonic } from '../api/word/[id]/mnemonic/client';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import EditMnemonic from './EditMnemonic.svelte';
	import WordCardDumb from './WordCardDumb.svelte';

	export let onRemove: (() => void) | undefined = undefined;

	export let word: UnknownWordResponse;
	$: inflected = word.inflected;
	$: english = word.english;
	$: mnemonic = word.mnemonic;

	let editMnemonic: string | undefined;

	async function generateMnemonic(word: DB.Word) {
		mnemonic = await fetchMnemonic(word.id, true);

		return mnemonic!;
	}

	async function saveMnemonic(newMnemonic: string) {
		mnemonic = newMnemonic;

		await storeMnemonic(word.id, mnemonic);

		editMnemonic = undefined;
	}
</script>

<WordCardDumb
	{word}
	{inflected}
	{onRemove}
	{mnemonic}
	{english}
	onEditMnemonic={async (word, mnemonic) => (editMnemonic = mnemonic || '')}
/>

{#if editMnemonic != undefined}
	<EditMnemonic
		wordString={word.word}
		{english}
		mnemonic={editMnemonic}
		generate={() => generateMnemonic(word)}
		onCancel={async () => (editMnemonic = undefined)}
		onSave={saveMnemonic}
	/>
{/if}
