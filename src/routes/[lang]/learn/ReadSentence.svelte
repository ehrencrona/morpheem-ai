<script lang="ts">
	import type { SendKnowledge } from '$lib/SendKnowledge';
	import { dedupUnknown } from '$lib/dedupUnknown';
	import Speak from '../../../components/Speak.svelte';
	import Tutorial from '../../../components/Tutorial.svelte';
	import { KNOWLEDGE_TYPE_READ } from '../../../db/knowledgeTypes';
	import * as DB from '../../../db/types';
	import type { Language, SentenceWord } from '../../../logic/types';
	import { fetchTranslation } from '../api/sentences/[sentence]/english/client';
	import { fetchHint } from '../api/sentences/[sentence]/hint/client';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { lookupUnknownWord } from '../api/word/unknown/client';

	import ReadSentenceDumb from './ReadSentenceDumb.svelte';

	export let sentence: DB.Sentence;
	export let words: SentenceWord[];
	export let word: DB.Word | undefined;
	export let language: Language;
	export let sendKnowledge: SendKnowledge;

	export let onNext: () => Promise<any>;

	let unknown: UnknownWordResponse[] = [];

	$: if (sentence.id) {
		unknown = [];
	}

	const getHint = () => fetchHint(sentence.id);
	const getTranslation = () => fetchTranslation(sentence.id);

	async function onUnknown(word: string) {
		const unknownWord = await lookupUnknownWord(word, sentence.id);

		unknown = dedupUnknown([...unknown, unknownWord]);
	}

	async function onRemoveUnknown(word: string) {
		unknown = unknown.filter((r) => r.word !== word);
	}

	async function storeAndContinue() {
		const sentenceId = sentence.id;
		const studiedWordId = word?.id;

		sendKnowledge(
			words.map((word) => ({
				word,
				wordId: word.id,
				sentenceId: sentenceId,
				isKnown: !unknown.find(({ id }) => id === word.id),
				studiedWordId,
				type: KNOWLEDGE_TYPE_READ,
				userId: -1
			}))
		);

		await onNext();
	}
</script>

<ReadSentenceDumb
	{word}
	{sentence}
	unknown={unknown}
	{getHint}
	{onUnknown}
	{onRemoveUnknown}
	{getTranslation}
	{language}
	onNext={storeAndContinue}
/>

{#if unknown.length}
	<Tutorial
		paragraphs={[
			`Take your time to memorize the word. You will get it again in future exercises.`,
			`You can ask questions about it in "ask me anything". Try asking "etymology?", "similar-sounding words?" or "other meanings?"`,
			`Click "mnemonic" to store a phrase to help you remember the word. It will be displayed with the word in the future.`
		]}
		id="unknown"
	/>
{:else}
	<Tutorial
		paragraphs={[
			`To grow your vocabulary, we show you sentences at a level you should find challenging.`,
			`By clicking words you don't know, you mark them for later repetition.`,
			`Click "I understand" to go to the next exercise.`
		]}
		id="read"
	/>
{/if}

<Speak url={`/${language.code}/api/sentences/${sentence.id}/tts.opus`} />
