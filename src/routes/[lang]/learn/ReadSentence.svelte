<script lang="ts">
	import { dedupUnknown } from '$lib/dedupUnknown';
	import { KNOWLEDGE_TYPE_READ } from '../../../db/knowledgeTypes';
	import * as DB from '../../../db/types';
	import type { AggKnowledgeForUser, Language, SentenceWord } from '../../../logic/types';
	import { sendKnowledge } from '../api/knowledge/client';
	import { fetchTranslation } from '../api/sentences/[sentence]/english/client';
	import { fetchHint } from '../api/sentences/[sentence]/hint/client';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { lookupUnknownWord } from '../api/word/unknown/client';

	import ReadSentenceDumb from './ReadSentenceDumb.svelte';

	export let sentence: DB.Sentence;
	export let words: SentenceWord[];
	export let word: DB.Word | undefined;
	export let knowledge: AggKnowledgeForUser[] | undefined = undefined;
	export let language: Language;

	export let onNext: () => Promise<any>;

	let revealed: UnknownWordResponse[] = [];

	$: if (sentence.id) {
		revealed = [];
	}

	const getHint = () => fetchHint(sentence.id);
	const getTranslation = () => fetchTranslation(sentence.id);


	async function onUnknown(word: string) {
		const unknownWord = await lookupUnknownWord(word, sentence.id);

		revealed = dedupUnknown([...revealed, unknownWord]);
	}

	async function onRemoveUnknown(word: string) {
		revealed = revealed.filter((r) => r.word !== word);
	}

	async function storeAndContinue() {
		const sentenceId = sentence.id;
		const studiedWordId = word?.id;

		await sendKnowledge(
			words.map((word) => ({
				wordId: word.id,
				sentenceId: sentenceId,
				isKnown: !revealed.find(({ id }) => id === word.id),
				studiedWordId,
				type: KNOWLEDGE_TYPE_READ,
				userId: -1
			})),
			true
		);

		await onNext();
	}
</script>

<ReadSentenceDumb
	{word}
	{sentence}
	{revealed}
	{getHint}
	{onUnknown}
	{onRemoveUnknown}
	{getTranslation}
	{knowledge}
	{language}
	onNext={storeAndContinue}
/>
