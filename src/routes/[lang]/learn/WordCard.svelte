<script lang="ts">
	import type * as DB from '../../../db/types';
	import { expectedKnowledge, now } from '../../../logic/isomorphic/knowledge';
	import type { AggKnowledgeForUser } from '../../../logic/types';
	import { fetchMnemonic, storeMnemonic } from '../api/word/[id]/mnemonic/client';
	import EditMnemonic from './EditMnemonic.svelte';
	import WordCardDumb from './WordCardDumb.svelte';

	export let onRemove: (() => void) | undefined = undefined;

	export let knowledge: AggKnowledgeForUser[] | undefined = undefined;

	export let word: DB.Word;
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

	function getExpectedKnowledge(word: DB.Word) {
		if (!knowledge) return undefined;

		const wordKnowledge = knowledge.find((k) => k.wordId === word.id);

		if (wordKnowledge) {
			return (
				Math.round(100 * expectedKnowledge(wordKnowledge, { now: now(), exercise: 'read' })) +
				'% known'
			);
		} else {
			return 'first time';
		}
	}
</script>

<WordCardDumb
	{word}
	{onRemove}
	{mnemonic}
	{english}
	onEditMnemonic={async (word, mnemonic) => (editMnemonic = mnemonic || '')}
	expectedKnowledge={getExpectedKnowledge(word)}
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
