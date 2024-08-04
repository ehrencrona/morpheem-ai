<script lang="ts">
	import { onMount } from 'svelte';
	import Dialog from '../../../components/Dialog.svelte';
	import Spinner from '../../../components/Spinner.svelte';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { lookupUnknownWord } from '../api/word/unknown/client';
	import WordCardDumb from './WordCardDumb.svelte';

	export let wordString: string;

	export let onClose: () => Promise<any>;

	let unknown: UnknownWordResponse | undefined = undefined;

	async function lookup(newWordString: string) {
		wordString = newWordString;
		unknown = undefined;
		unknown = await lookupUnknownWord(wordString);
	}

	onMount(async () => lookup(wordString));
</script>

<Dialog onCancel={onClose} hasPadding={false} width={500}>
	{#if unknown}
		<WordCardDumb
			word={unknown}
			mnemonic={unknown.mnemonic}
			related={unknown.related}
			english={unknown.english}
			onEditMnemonic={undefined}
			onSelectRelated={lookup}
      addBottomMargin={false}
		/>
	{:else}
		<div class="flex p-6 justify-center items-center">
			<div><Spinner /></div>
		</div>
	{/if}
</Dialog>
