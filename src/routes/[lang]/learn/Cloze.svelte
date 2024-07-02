<script lang="ts">
	import type { SendKnowledge } from '$lib/SendKnowledge';
	import { dedupUnknown } from '$lib/dedupUnknown';
	import { filterUndefineds } from '$lib/filterUndefineds';
	import { logError } from '$lib/logError';
	import { toPercent } from '$lib/toPercent';
	import Speak from '../../../components/Speak.svelte';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import Tutorial from '../../../components/Tutorial.svelte';
	import { KNOWLEDGE_TYPE_CLOZE, KNOWLEDGE_TYPE_READ } from '../../../db/knowledgeTypes';
	import * as DB from '../../../db/types';
	import type { Evaluation } from '../../../logic/evaluateCloze';
	import { expectedKnowledge, now } from '../../../logic/isomorphic/knowledge';
	import { standardize } from '../../../logic/isomorphic/standardize';
	import { toWords, toWordsWithSeparators } from '../../../logic/toWords';
	import type { Language, SentenceWord } from '../../../logic/types';
	import { fetchClozeEvaluation } from '../api/cloze/client';
	import type { Translation } from '../api/sentences/[sentence]/english/client';
	import { fetchTranslation } from '../api/sentences/[sentence]/english/client';
	import { fetchInflections } from '../api/word/[id]/inflections/client';
	import { fetchMnemonic } from '../api/word/[id]/mnemonic/client';
	import { fetchWordsByPrefix } from '../api/word/prefix/[prefix]/client';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { lookupUnknownWord } from '../api/word/unknown/client';
	import { fetchAskMeAnything } from '../api/write/ama/client';
	import Ama from './AMA.svelte';
	import type { SuggestedWords } from './ClozeDumb.svelte';
	import ClozeDumb from './ClozeDumb.svelte';

	export let sentence: DB.Sentence;
	export let word: DB.Word;
	export let sentenceWords: SentenceWord[];
	export let language: Language;
	export let sendKnowledge: SendKnowledge;
	export let exerciseId: number | null;
	export let exercise: 'cloze' | 'cloze-inflection' = 'cloze';

	export let knowledge: DB.AggKnowledgeForUser[] | undefined = undefined;

	let isLoadingSuggestions = false;
	let isFetchingEvaluation = false;
	let unknown: UnknownWordResponse[] = [];
	let offerSuggestions = true;

	$: if (sentence.id) {
		unknown = [];
	}

	async function onUnknown(word: string) {
		const unknownWord = await lookupUnknownWord(word, sentence.id);

		unknown = dedupUnknown([...unknown, unknownWord]);
	}

	async function onRemoveUnknown(word: string) {
		unknown = unknown.filter((r) => r.word !== word);
	}

	export let onNext: () => Promise<any>;

	let unknownWord: UnknownWordResponse | undefined = undefined;
	let sentenceTranslation: Translation | undefined = undefined;
	let mnemonic: string | undefined = undefined;
	let showChars = 0;
	let suggestedWords: SuggestedWords = {
		words: [],
		type: 'lemma'
	};
	let isPickingInflection = false;
	let evaluation: Evaluation | undefined = undefined;

	let inflections: string[] = [];

	$: sentenceWord = findSentenceWord(sentenceWords, word);

	$: if (sentenceWord) {
		let wordWas = word;

		lookupUnknownWord(sentenceWord.conjugatedWord, sentence.id)
			.then((got) => {
				if (word.word == got.word && word.id == wordWas.id) {
					unknownWord = got;
				}
			})
			.catch(logError);
	}

	$: if (sentence.id) {
		clear();
	}

	async function clear() {
		showChars = 0;
		suggestedWords = {
			words: [],
			type: 'lemma'
		};
		isPickingInflection = false;
		unknownWord = undefined;
		sentenceTranslation = undefined;
		evaluation = undefined;
		mnemonic = undefined;
		inflections = [];

		isLoadingSuggestions = true;

		let wordWas = word;

		[mnemonic, inflections] = await Promise.all([
			fetchMnemonic(word.id, false),
			fetchInflections(word.id).finally(() => (isLoadingSuggestions = false))
		]).catch((e) => {
			logError(e);
			return [undefined, []];
		});

		if (word != wordWas) {
			return;
		}

		if (exercise == 'cloze-inflection' && inflections.length > 1) {
			suggestedWords = { type: 'inflection', words: inflections };
			isPickingInflection = true;
		}

		const wordKnowledge = knowledge?.find((k) => k.wordId === word.id);
		let chanceOfKnowing = 0;

		if (wordKnowledge) {
			chanceOfKnowing = expectedKnowledge(wordKnowledge, {
				now: now(),
				exercise: 'cloze'
			});
		}

		console.log(`Chance of knowing ${word.word}: ${toPercent(chanceOfKnowing)}`);

		if (chanceOfKnowing > 0.8 && exercise == 'cloze') {
			offerSuggestions = false;
		}
	}

	function findSentenceWord(sentenceWords: SentenceWord[], word: DB.Word) {
		const wordStrings = toWords(sentence.sentence, language);
		const wordIndex = sentenceWords.findIndex(({ id }) => id === word.id);

		if (wordIndex >= 0 && sentenceWords.length == wordStrings.length) {
			const sentenceWord = sentenceWords[wordIndex];
			const conjugatedWord = wordStrings[wordIndex];

			console.log(
				`Word ${sentenceWord.word} (${sentenceWord.id}) found in sentence "${sentence.sentence}" (${sentence.id}).`
			);

			return {
				...sentenceWord,
				conjugatedWord
			};
		} else {
			logError(
				`Word ${word.word} (${word.id}) not found in sentence "${sentence.sentence}" (${sentence.id}). SentenceWords: ${sentenceWords
					.map(({ word, id }) => `${word} (${id})`)
					.join(', ')}; wordStrings: ${wordStrings.join(', ')}`
			);
		}
	}

	async function onHint() {
		if (showChars < 2 && showChars < word.word.length - 1) {
			showChars++;
		} else {
			onReveal();
		}
	}

	async function onReveal() {
		showChars = 100;

		evaluation = {
			answered: '',
			outcome: exercise == 'cloze-inflection' ? 'wrongForm' : 'wrong'
		};
	}

	async function onTranslate() {
		sentenceTranslation = await fetchTranslation(sentence.id);
	}

	let typeCount = 0;

	async function onType(prefix: string) {
		if (!offerSuggestions) {
			return;
		}

		const timer = setTimeout(() => {
			isLoadingSuggestions = true;
		}, 100);

		typeCount++;

		try {
			let oldTypeCount = typeCount;
			let oldWord = word;

			const sw = isPickingInflection
				? inflections.filter((w) => w.startsWith(prefix))
				: prefix.length > 0 && showChars < 100
					? await fetchWordsByPrefix(prefix)
					: [];

			if (oldTypeCount == typeCount && word == oldWord) {
				suggestedWords = { type: isPickingInflection ? 'inflection' : 'lemma', words: sw };
			}
		} catch (e) {
			logError(e);
		} finally {
			clearTimeout(timer);
			isLoadingSuggestions = false;
		}
	}

	async function onPickedWord(answered: string) {
		if (!isPickingInflection) {
			if (answered == word.word) {
				if (inflections.length <= 1) {
					return onAnswer(answered);
				}

				console.log(`Picked word "${answered}". Pick inflection among ${inflections.join(', ')}.`);

				suggestedWords = {
					type: 'inflection',
					words: inflections
				};
			} else {
				console.log(`Picked unexpected word "${answered}". Loading inflections.`);

				suggestedWords = {
					type: 'inflection',
					words: []
				};

				isLoadingSuggestions = true;

				fetchInflections(answered)
					.then((words) => {
						suggestedWords = {
							type: 'inflection',
							words
						};

						if (suggestedWords.words.length <= 1) {
							onAnswer(answered);
						}
					})
					.catch(logError)
					.finally(() => (isLoadingSuggestions = false));
			}

			isPickingInflection = true;
		} else {
			return onAnswer(answered);
		}
	}

	async function onAnswer(answered: string) {
		if (!sentenceWord) {
			throw new Error(`Invalid state, sentenceWord is undefined`);
		}

		answered = standardize(answered);

		const { conjugatedWord } = sentenceWord;

		let isCorrectInflection = answered == conjugatedWord;
		let isAnyInflection = inflections.includes(answered);

		let isCorrectLemma = isCorrectInflection || isAnyInflection;

		evaluation = {
			answered,
			outcome: isCorrectLemma ? (isCorrectInflection ? 'correct' : 'wrongForm') : 'wrong'
		};

		console.log(
			`Answered "${answered}". Correct conjugated: "${conjugatedWord}". outcome: ${evaluation.outcome}`
		);

		if (!(isCorrectLemma && isCorrectInflection)) {
			const wordWas = word;
			isFetchingEvaluation = true;

			const gotEvaluation = await fetchClozeEvaluation({
				cloze: toWordsWithSeparators(sentence.sentence, language).reduce(
					(cloze, word) =>
						cloze + (standardize(word) == standardize(conjugatedWord) ? '______' : word),
					''
				),
				hint: unknownWord?.english || '',
				answered,
				correctAnswer: {
					id: word.id,
					conjugated: conjugatedWord,
					word: word.word
				},
				isRightLemma: isCorrectLemma
			}).finally(() => (isFetchingEvaluation = false));

			if (word === wordWas) {
				console.log(
					`Got evaluation for "${answered}": Outcome: ${gotEvaluation.outcome}${gotEvaluation.alternateWord ? `; Alternate: ${gotEvaluation.alternateWord.word}` : ''}`
				);

				evaluation = gotEvaluation;
			}
		}
	}

	async function storeAndContinue() {
		if (!evaluation) {
			throw new Error(`Invalid state, evaluation is undefined`);
		}

		const { outcome, alternateWord } = evaluation;

		const isCorrect = outcome == 'correct' || outcome == 'alternate';

		sendKnowledge(
			filterUndefineds(
				sentenceWords.map((sentenceWord: DB.Word) => {
					const isClozeWord = sentenceWord.id == word.id;

					if (exercise == 'cloze-inflection' && isClozeWord) {
						return undefined;
					}

					if (isClozeWord && alternateWord) {
						sentenceWord = alternateWord;
					}

					return {
						word: sentenceWord,
						wordId: sentenceWord.id,
						sentenceId: sentence.id,
						isKnown: isClozeWord
							? (outcome == 'correct' || outcome == 'alternate' || outcome == 'typo') && !showChars
							: !unknown.find(({ id }) => id === sentenceWord.id),
						studiedWordId: word.id,
						type: isClozeWord ? KNOWLEDGE_TYPE_CLOZE : KNOWLEDGE_TYPE_READ,
						userId: -1
					};
				})
			),
			outcome == 'wrongForm' || exerciseId != null
				? [
						{
							id: exerciseId,
							wordId: word.id,
							word: word.word,
							sentenceId: sentence.id,
							isKnown: isCorrect,
							exercise:
								isCorrect && exerciseId != null
									? exercise
									: outcome == 'wrongForm'
										? 'cloze-inflection'
										: 'cloze',
							level: word.level
						}
					]
				: undefined
		);

		await onNext();
	}
</script>

{#if sentenceWord}
	<ClozeDumb
		{sentence}
		word={sentenceWord}
		{evaluation}
		{exercise}
		{onHint}
		onNext={storeAndContinue}
		{onUnknown}
		{onRemoveUnknown}
		{onReveal}
		{onType}
		{onAnswer}
		{onPickedWord}
		{onTranslate}
		{isPickingInflection}
		{isFetchingEvaluation}
		{unknownWord}
		{sentenceTranslation}
		{showChars}
		{suggestedWords}
		{unknown}
		{language}
		{isLoadingSuggestions}
	/>
{:else}
	<SpinnerButton onClick={storeAndContinue}>Continue</SpinnerButton>
{/if}

{#if !offerSuggestions}
	<Tutorial
		paragraphs={[
			`When you already know a word well there are no suggestions; you have to type the word unaided.`
		]}
		id="no-suggestions"
	/>
{:else if exercise == 'cloze-inflection'}
	<Tutorial
		paragraphs={[
			`You have chosen the wrong form of this word before, so this exercise is only about chosing the right form.`
		]}
		id="cloze-inflection"
	/>
{:else}
	<Tutorial
		paragraphs={[
			`Fill-in-the blanks exercises test your ability to produce words in context.`,
			`They test words you already have a good passive knowledge of.`,
			`There can be multiple correct answers.`
		]}
		id="cloze"
	/>
{/if}

{#if evaluation}
	<Speak url={`/${language.code}/api/sentences/${sentence.id}/tts.opus`} />
{/if}

<Ama
	ask={(question) =>
		fetchAskMeAnything({
			exercise: 'cloze',
			question,
			word: word.word,
			confusedWord: evaluation?.answered,
			sentence: sentence.sentence,
			unknown
		})}
	wordId={word.id}
	suggestions={[
		'Can I express this differently?',
		`How do you say 'banana' in ${language.name}?`,
		...(unknown.length
			? ['Etymology?', 'Other meanings?', 'Similar-sounding words?', 'Synonyms?', 'Examples?']
			: [])
	]}
/>
