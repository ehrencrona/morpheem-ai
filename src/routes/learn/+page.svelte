<script lang="ts">
	import { toWords, toWordsWithSeparators } from '../../logic/toWords';
	import type { load } from './+page.server';

	export let data: Awaited<ReturnType<typeof load>>;

	$: sentence = data.sentence;
	$: words = data.words;

	$: wordStrings = toWords(sentence.sentence);
	$: wordsWithSeparators = toWordsWithSeparators(sentence.sentence);

	let revealTranslation = false;

	let revealedWords: typeof data.words = [];

	function storeKnowledge(
		knowledge: Array<{
			wordId: number;
			sentenceId: number;
			userId: number;
			isKnown: boolean;
		}>
	) {
		if (!knowledge.length) {
			return;
		}

		return fetch('/api/knowledge', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(knowledge)
		});
	}

	async function reveal(index: number) {
		if (!revealedWords.includes(words[index])) {
			revealedWords = revealedWords.concat(words[index]);

			await storeKnowledge([
				{
					wordId: words[index].id!,
					sentenceId: sentence.id,
					userId: 4711,
					isKnown: false
				}
			]);
		}
	}

	let error: string;

	async function next() {
		try {
			await storeKnowledge(
				words
					.filter((word) => !revealedWords.includes(word))
					.map((word) => ({
						wordId: word.id!,
						sentenceId: sentence.id,
						userId: 4711,
						isKnown: true
					}))
			);

			await fetch('/api/learn', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			})
				.then((response) => response.json())
				.then((data) => {
					revealedWords = [];

					({ sentence, words } = data);
				});
		} catch (e: any) {
			console.error(e);

			error = e.message;
		}
	}
</script>

<main>
	{#if error}
		<h3>{error}</h3>
	{/if}

	<h1>
		{#each wordsWithSeparators as word, index}{#if wordStrings.includes(word.toLowerCase())}<span
					style="cursor: pointer"
					on:click={() => reveal(wordStrings.indexOf(word.toLowerCase()))}>{word}</span
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

	<button on:click={next}> Next </button>
</main>
