<script lang="ts">
	import type * as DB from '../../db/types';
	import { expectedKnowledge, now } from '../../logic/isomorphic/knowledge';
	import { isSeparator, toWordsWithSeparators } from '../../logic/toWords';
	import type { AggKnowledgeForUser } from '../../logic/types';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';

	export let sentence: DB.Sentence;
	export let word: DB.Word | undefined;
	export let knowledge: AggKnowledgeForUser[];

	export let revealed: (UnknownWordResponse & { mnemonic?: string })[];

	export let onUnknown: (word: string) => Promise<any>;

	let hint: string | undefined;
	let translation: string | undefined;

	export let getHint: () => Promise<string>;
	export let getTranslation: () => Promise<string>;
	export let getMnemonic: (word: DB.Word) => Promise<any>;

	$: wordsWithSeparators = toWordsWithSeparators(sentence.sentence);

	$: if (sentence) {
		hint = undefined;
		translation = undefined;
	}

	function getExpectedKnowledge(word: DB.Word) {
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

{#if word}
	<div><i>{word.word}</i></div>
{/if}

<h1>
	{#each wordsWithSeparators as word, index}{#if !isSeparator(word)}<span
				style="cursor: pointer"
				role="button"
				tabindex={index}
				on:click={() => onUnknown(word)}>{word}</span
			>{:else}{word}{/if}{/each}
</h1>

{#if translation}
	<p><i>{translation}</i></p>
{:else}
	<button on:click={() => getTranslation().then((got) => (translation = got))}>
		Show translation
	</button>

	{#if hint}
		<p><i>{hint}</i></p>
	{:else}
		<button on:click={() => getHint().then((got) => (hint = got))}> Show hint </button>
	{/if}
{/if}

<ul>
	{#each revealed as word}
		<li>
			<a href="/words/{word.id}">{word.word}</a>: {word.english}
			<span style="font-size: 60%">({word.level}% level, {getExpectedKnowledge(word)})</span>
			{#if word.mnemonic}
				<p>{word.mnemonic}</p>
			{:else}
				<button on:click={() => getMnemonic(word)}>Mnemonic</button>
			{/if}
		</li>
	{/each}
</ul>
