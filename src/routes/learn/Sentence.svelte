<script lang="ts">
	import type * as DB from '../../db/types';
	import { isSeparator, toWordsWithSeparators } from '../../logic/toWords';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';

	export let sentence: DB.Sentence;

	export let revealed: (UnknownWordResponse & { explanation?: string[] })[];

	export let onUnknown: (word: string) => Promise<any>;
	export let onExplain: (word: string) => Promise<any>;

	$: wordsWithSeparators = toWordsWithSeparators(sentence.sentence);

	let revealTranslation = false;

	$: if (sentence) {
		revealTranslation = false;
	}
</script>

<h1>
	{#each wordsWithSeparators as word, index}{#if !isSeparator(word)}<span
				style="cursor: pointer"
				role="button"
				tabindex={index}
				on:click={() => onUnknown(word)}>{word}</span
			>{:else}{word}{/if}{/each}
</h1>

{#if revealTranslation}
	<p><i>{sentence.english}</i></p>
{:else}
	<button on:click={() => (revealTranslation = !revealTranslation)}> Show translation </button>
{/if}

<ul>
	{#each revealed as word}
		<li>
			<a href="/words/{word.id}">{word.lemma}</a>: {word.english}
			{#if word.explanation}
				{#each word.explanation as explanation}
					<p>{explanation}</p>
				{/each}
			{:else}
				<button on:click={() => onExplain(word.lemma)}>More...</button>
			{/if}
		</li>
	{/each}
</ul>
