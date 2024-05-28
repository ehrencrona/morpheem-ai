<script lang="ts">
	import { KNOWLEDGE_TYPE_CLOZE } from '../../../db/knowledgeTypes';
	import * as DB from '../../../db/types';
	import type { AggKnowledgeForUser, SentenceWord } from '../../../logic/types';
	import { sendKnowledge } from '../api/knowledge/client';
	import { fetchTranslation } from '../api/sentences/[sentence]/english/client';
	import { fetchMnemonic } from '../api/word/[id]/mnemonic/client';
	import { fetchWordsByPrefix } from '../api/word/prefix/[prefix]/client';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { lookupUnknownWord } from '../api/word/unknown/client';
	import { fetchAskMeAnything } from '../api/write/ama/client';
	import Ama from './AMA.svelte';
	import ClozeDumb from './ClozeDumb.svelte';

	export let sentence: DB.Sentence;
	export let word: DB.Word;
	export let sentenceWords: SentenceWord[];
	export let revealed: UnknownWordResponse[];
	export let knowledge: AggKnowledgeForUser[] = [];

	export let onUnknown: (word: string) => Promise<any>;
	export let onRemoveUnknown: (word: string) => Promise<any>;

	export let onNext: () => Promise<any>;

	let englishWord: string | undefined = undefined;
	let englishSentence: string | undefined = undefined;
	let mnemonic: string | undefined = undefined;
	let showChars = 0;
	let suggestedWords: string[] = [];
	let userSelection: string | undefined;

	async function clear() {
		showChars = 0;
		suggestedWords = [];
		userSelection = undefined;
		englishWord = undefined;
		englishSentence = undefined;

		mnemonic = await fetchMnemonic(word.id, false);
	}

	$: if (word.id || sentence.id) {
		lookupUnknownWord(word.word, sentence.id)
			.then((translated) => {
				if (word.word == translated.word) {
					englishWord = translated.english;
				}
			})
			.catch(console.error);
	}

	$: if (sentence.id) {
		clear();
	}

	async function onHint() {
		if (showChars < 2) {
			showChars++;
		} else {
			showChars = 100;
		}
	}

	async function onReveal() {
		showChars = 100;
	}

	async function onTranslate() {
		englishSentence = await fetchTranslation(sentence.id);
	}

	async function onType(prefix: string) {
		suggestedWords = prefix.length > 0 ? await fetchWordsByPrefix(prefix) : [];
	}

	async function onAnswer(wordString: string) {
		onReveal();
		userSelection = wordString;
	}

	async function storeAndContinue(knew: boolean) {
		sendKnowledge(
			[
				{
					sentenceId: sentence.id,
					wordId: word.id,
					isKnown: knew,
					type: KNOWLEDGE_TYPE_CLOZE,
					userId: -1,
					studiedWordId: word.id
				}
			],
			true
		).catch((e) => console.error(e));

		await onNext();
	}
</script>

<ClozeDumb
	{sentence}
	{word}
	{sentenceWords}
	{onHint}
	onNext={storeAndContinue}
	{onUnknown}
	{onRemoveUnknown}
	{onReveal}
	{onType}
	{onAnswer}
	{onTranslate}
	{englishWord}
	{englishSentence}
	{mnemonic}
	{showChars}
	{suggestedWords}
	answered={userSelection}
	{revealed}
	{knowledge}
/>

<div
	class="absolute bottom-0 left-0 right-0 bg-[#ffffff] px-4 py-2 flex justify-center center"
	style="box-shadow: 0 -2px 4px -1px rgba(0, 0, 0, 0.1);"
>
	<div class="w-full max-w-[800px]">
		<Ama
			explanation="You can refer to the current sentence or the word you chose."
			ask={(question) =>
				fetchAskMeAnything({
					type: 'cloze',
					question,
					word: word.word,
					confusedWord: userSelection,
					sentence: sentence.sentence,
					revealed
				})}
			wordId={word.id}
		/>
	</div>
</div>
