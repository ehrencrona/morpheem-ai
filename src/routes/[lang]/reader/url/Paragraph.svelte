<script lang="ts">
	import { isSeparator, toWordsWithSeparators } from '../../../../logic/toWordStrings';
	import type { Language } from '../../../../logic/types';
	import type { UnknownWordResponse } from '../../api/word/unknown/+server';

	export let text: string;
	export let language: Language;
	export let unknown: UnknownWordResponse[];
	export let onClickedWord: (word: string) => void;

	$: words = toWordsWithSeparators(text, language);
</script>

{#each words as word, index}{#if !isSeparator(word)}<span
			style="cursor: pointer"
			role="button"
			tabindex={index}
			class={unknown.find((r) => (r.inflected || r.word) == word)
				? 'border-b-2 border-blue-3 border-dotted'
				: 'hover:underline decoration-yellow'}
			on:click={() => onClickedWord(word)}>{word}</span
		>{:else}{word}{/if}{/each}
