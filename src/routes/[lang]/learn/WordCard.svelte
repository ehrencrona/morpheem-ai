<script lang="ts">
	import type * as DB from '../../../db/types';
	import { fetchMnemonic, storeMnemonic } from '../api/word/[id]/mnemonic/client';
	import EditMnemonic from './EditMnemonic.svelte';
	import WordCardDumb from './WordCardDumb.svelte';

	export let onRemove: (() => void) | undefined = undefined;

	export let word: DB.Word;
	export let inflected: string | undefined = undefined;
	export let form: string | undefined = undefined;
	export let english: string | undefined = undefined;
	export let mnemonic: string | undefined = undefined;

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
	{form}
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
