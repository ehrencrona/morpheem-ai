<script lang="ts">
	import { dedupUnknown } from '$lib/dedupUnknown';
	import { KNOWLEDGE_TYPE_CLOZE, KNOWLEDGE_TYPE_READ } from '../../../db/knowledgeTypes';
	import * as DB from '../../../db/types';
	import { standardize } from '../../../logic/isomorphic/standardize';
	import { toWords, toWordsWithSeparators } from '../../../logic/toWords';
	import type {
		AggKnowledgeForUser,
		Language,
		SentenceWord,
		WordKnowledge
	} from '../../../logic/types';
	import { fetchClozeEvaluation } from '../api/cloze/client';
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
	export let knowledge: AggKnowledgeForUser[] | undefined = undefined;
	export let language: Language;
	export let sendKnowledge: (words: (WordKnowledge & { word: DB.Word })[]) => void;

	let evaluation: string | undefined = undefined;

	let isLoadingSuggestions = false;
	let revealed: UnknownWordResponse[] = [];

	$: if (sentence.id) {
		revealed = [];
	}

	async function onUnknown(word: string) {
		const unknownWord = await lookupUnknownWord(word, sentence.id);

		revealed = dedupUnknown([...revealed, unknownWord]);
	}

	async function onRemoveUnknown(word: string) {
		revealed = revealed.filter((r) => r.word !== word);
	}

	export let onNext: () => Promise<any>;

	let englishWord: string | undefined = undefined;
	let englishSentence: string | undefined = undefined;
	let mnemonic: string | undefined = undefined;
	let showChars = 0;
	let suggestedWords: string[] = [];
	let answered: string | undefined;

	async function clear() {
		showChars = 0;
		suggestedWords = [];
		answered = undefined;
		englishWord = undefined;
		englishSentence = undefined;
		evaluation = undefined;

		mnemonic = await fetchMnemonic(word.id, false);
	}

	$: if (word.id || sentence.id) {
		let wordWas = word;

		lookupUnknownWord(word.word, sentence.id)
			.then((translated) => {
				if (word.word == translated.word && word.id == wordWas.id) {
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
		const timer = setTimeout(() => {
			isLoadingSuggestions = true;
		}, 200);

		try {
			suggestedWords = prefix.length > 0 && showChars < 100 ? await fetchWordsByPrefix(prefix) : [];
		} finally {
			clearTimeout(timer);
			isLoadingSuggestions = false;
		}
	}

	async function onAnswer(answerGiven: string) {
		onReveal();
		answered = answerGiven;

		const conjugatedWord = toWords(sentence.sentence, language)[
			sentenceWords.findIndex((w) => w.id === word.id)
		];

		const isCorrect = answered == word.word || answered == conjugatedWord;

		if (!isCorrect) {
			const wordWas = word;
			const gotEvaluation = await fetchClozeEvaluation({
				cloze: toWordsWithSeparators(sentence.sentence, language).reduce(
					(cloze, word) =>
						cloze + (standardize(word) == standardize(conjugatedWord) ? '______' : word),
					''
				),
				clue: englishWord || '',
				userAnswer: answered,
				correctAnswer: word.word
			});

			if (word.id == wordWas.id) {
				evaluation = gotEvaluation;
			}
		}
	}

	async function storeAndContinue(knew: boolean) {
		sendKnowledge(
			sentenceWords.map((sentenceWord) => {
				const isCloze = sentenceWord.id == word.id;

				return {
					word: sentenceWord,
					wordId: sentenceWord.id,
					sentenceId: sentence.id,
					isKnown: isCloze ? knew : !revealed.find(({ id }) => id === sentenceWord.id),
					studiedWordId: word.id,
					type: isCloze ? KNOWLEDGE_TYPE_CLOZE : KNOWLEDGE_TYPE_READ,
					userId: -1
				};
			})
		);

		await onNext();
	}
</script>

<ClozeDumb
	{sentence}
	{word}
	{sentenceWords}
	{evaluation}
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
	{answered}
	{revealed}
	{knowledge}
	{language}
	{isLoadingSuggestions}
/>

<Ama
	ask={(question) =>
		fetchAskMeAnything({
			type: 'cloze',
			question,
			word: word.word,
			confusedWord: answered,
			sentence: sentence.sentence,
			revealed
		})}
	wordId={word.id}
	suggestions={[
		'Can I express this differently?',
		`How do you say "banana" in ${language.name}?`,
		...(revealed.length
			? ['Etymology?', 'Other meanings?', 'Similar-sounding words?', 'Synonyms?', 'Examples?']
			: [])
	]}
/>
