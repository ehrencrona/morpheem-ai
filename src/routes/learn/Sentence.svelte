<script lang="ts">
	import type * as DB from '../../db/types';
	import { toWords, toWordsWithSeparators } from '../../logic/toWords';

	export let sentence: DB.Sentence;

	export let words: DB.Word[];

	export let onReveal: (word: DB.Word) => void;

	$: wordStrings = toWords(sentence.sentence);
	$: wordsWithSeparators = toWordsWithSeparators(sentence.sentence);

	let revealTranslation = false;

	let revealedWords: DB.Word[] = [];

	$: if (sentence) {
		revealedWords = [];
		revealTranslation = false;
	}

	async function reveal(index: number) {
		if (!words || !sentence) {
			throw new Error('Invalid state');
		}

		if (!revealedWords.includes(words[index])) {
			revealedWords = revealedWords.concat(words[index]);

			onReveal(words[index]);
		}
	}
</script>

<h1>
	{#each wordsWithSeparators as word, index}{#if wordStrings.includes(word.toLowerCase())}<span
				style="cursor: pointer"
				on:click={() =>
					reveal(words.findIndex((w) => w.word_index == wordStrings.indexOf(word.toLowerCase())))}
				>{word}</span
			>{:else}{word}{/if}{/each}
</h1>

{#if revealTranslation}
	<p><i>{sentence.english}</i></p>
{:else}
	<button on:click={() => (revealTranslation = !revealTranslation)}> Show translation </button>
{/if}

<ul>
	{#each revealedWords as word}
		<li>
			<a href="/words/{word.id}">{word.word}</a>: {word.english}
		</li>
	{/each}
</ul>
