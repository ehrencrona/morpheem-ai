<script lang="ts">
	import type * as DB from '../../db/types';
	import { expectedKnowledge, now } from '../../logic/isomorphic/knowledge';
	import type { AggKnowledgeForUser } from '../../logic/types';
	import { fetchMnemonic, storeMnemonic } from '../api/word/[id]/mnemonic/client';
	import EditMnemonic from './EditMnemonic.svelte';
	import WordCardDumb from './WordCardDumb.svelte';

	export let word: DB.Word;
	export let onRemove: (() => void) | undefined = undefined;
	export let english: string | undefined = undefined;
	export let knowledge: AggKnowledgeForUser[] | undefined = undefined;

	let mnemonic: string | undefined = undefined;
	let editMnemonic: (DB.Word & { mnemonic?: string | undefined }) | undefined;

	async function getMnemonic(word: DB.Word, forceRegeneration: boolean) {
		mnemonic = await fetchMnemonic(word.id, forceRegeneration);
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
				Math.round(
					100 * expectedKnowledge(wordKnowledge, { now: now(), lastTime: wordKnowledge.time })
				) + '% known'
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
	onGetMnemonic={getMnemonic}
	onEditMnemonic={async (word) => (editMnemonic = word)}
	expectedKnowledge={getExpectedKnowledge(word)}
/>

{#if editMnemonic}
	<EditMnemonic
		mnemonic={editMnemonic.mnemonic}
		onCancel={async () => (editMnemonic = undefined)}
		onSave={saveMnemonic}
	/>
{/if}
