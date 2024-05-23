<script lang="ts">
	import { KNOWLEDGE_TYPE_CLOZE } from '../../db/knowledgeTypes';
	import * as DB from '../../db/types';
	import type { AggKnowledgeForUser, SentenceWord } from '../../logic/types';
	import { userId } from '../../logic/user';
	import { sendKnowledge } from '../api/knowledge/client';
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

	let english: string | undefined = undefined;
	let mnemonic: string | undefined = undefined;
	let showPercentage = 0;
	let suggestedWords: string[] = [];
	let userSelection: string | undefined;
	let showEnglish = false;

	async function clear() {
		showPercentage = 0;
		suggestedWords = [];
		userSelection = undefined;
		showEnglish = false;
		english = (await lookupUnknownWord(word.word, sentence.id, word.id)).english;
		mnemonic = await fetchMnemonic(word.id, false);
	}

	$: if (sentence.id) {
		clear();
	}

	async function onHint() {
		if (showEnglish) {
			showPercentage += 1 / 3;
		} else {
			showEnglish = true;
		}
	}

	async function onReveal() {
		showPercentage = 1;
	}

	async function onType(wordString: string) {
		suggestedWords = wordString.length > 0 ? await fetchWordsByPrefix(wordString) : [];
	}

	async function onAnswer(wordString: string) {
		onReveal();
		userSelection = wordString;
	}

	async function storeAndContinue(knew: boolean) {
		sendKnowledge([
			{
				sentenceId: sentence.id,
				wordId: word.id,
				isKnown: knew,
				type: KNOWLEDGE_TYPE_CLOZE,
				userId,
				studiedWordId: word.id
			}
		]).catch((e) => console.error(e));

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
	{english}
	{mnemonic}
	{showPercentage}
	{showEnglish}
	{suggestedWords}
	{userSelection}
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
