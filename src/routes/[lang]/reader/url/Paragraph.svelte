<script lang="ts">
	import { isSeparator, toWordsWithSeparators } from '../../../../logic/toWordStrings';
	import type { Language } from '../../../../logic/types';
	import type { UnknownWordResponse } from '../../api/word/unknown/+server';

	export let text: string;
	export let language: Language;
	export let unknown: UnknownWordResponse[];
	export let onClickedWord: (word: string, text: string) => void;

	$: words = toWordsWithSeparators(text, language);

	function getContext(word: string) {
		const index = words.findIndex((w) => w === word);

		const size = 16;

		return '...' + words.slice(Math.max(0, index - size), index + size).join('') + '...';
	}
</script>

{#each words as word, index}{#if !isSeparator(word)}<span
			style="cursor: pointer"
			role="button"
			tabindex={index}
			class={unknown.find((r) => (r.inflected || r.word) == word)
				? 'border-b-2 border-blue-3 border-dotted'
				: 'hover:underline decoration-yellow'}
			on:click={() => onClickedWord(word, getContext(word))}>{word}</span
		>{:else}{word}{/if}{/each}
