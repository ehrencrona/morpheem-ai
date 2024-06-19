<script lang="ts">
	import type { SendKnowledge } from '$lib/SendKnowledge';
	import { dedupUnknown } from '$lib/dedupUnknown';
	import { filterUndefineds } from '$lib/filterUndefineds';
	import { toPercent } from '$lib/toPercent';
	import ErrorComponent from '../../../components/Error.svelte';
	import Speak from '../../../components/Speak.svelte';
	import Tutorial from '../../../components/Tutorial.svelte';
	import { KNOWLEDGE_TYPE_CLOZE, KNOWLEDGE_TYPE_READ } from '../../../db/knowledgeTypes';
	import * as DB from '../../../db/types';
	import { expectedKnowledge, now } from '../../../logic/isomorphic/knowledge';
	import { standardize } from '../../../logic/isomorphic/standardize';
	import { toWords, toWordsWithSeparators } from '../../../logic/toWords';
	import type { Language, SentenceWord } from '../../../logic/types';
	import { fetchClozeEvaluation } from '../api/cloze/client';
	import { fetchTranslation } from '../api/sentences/[sentence]/english/client';
	import type { Translation } from '../api/sentences/[sentence]/english/client';
	import { fetchInflections } from '../api/word/[id]/inflections/client';
	import { fetchMnemonic } from '../api/word/[id]/mnemonic/client';
	import { fetchWordsByPrefix } from '../api/word/prefix/[prefix]/client';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { lookupUnknownWord } from '../api/word/unknown/client';
	import { fetchAskMeAnything } from '../api/write/ama/client';
	import Ama from './AMA.svelte';
	import ClozeDumb from './ClozeDumb.svelte';
	import type { Evaluation, SuggestedWords } from './ClozeDumb.svelte';

	export let sentence: DB.Sentence;
	export let word: DB.Word;
	export let sentenceWords: SentenceWord[];
	export let language: Language;
	export let sendKnowledge: SendKnowledge;
	export let source: DB.ExerciseSource;
	export let exercise: 'cloze' | 'cloze-inflection' = 'cloze';

	export let knowledge: DB.AggKnowledgeForUser[] | undefined = undefined;

	let error: any;
	let isLoadingSuggestions = false;
	let isFetchingEvaluation = false;
	let revealed: UnknownWordResponse[] = [];
	let offerSuggestions = true;

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

	let wordTranslation: string | undefined = undefined;
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

	async function clear() {
		showChars = 0;
		suggestedWords = {
			words: [],
			type: 'lemma'
		};
		isPickingInflection = false;
		wordTranslation = undefined;
		sentenceTranslation = undefined;
		evaluation = undefined;
		mnemonic = undefined;
		inflections = [];
		error = undefined;

		[mnemonic, inflections] = await Promise.all([
			fetchMnemonic(word.id, false).catch((e) => (error = e)),
			fetchInflections(word.id).catch((e) => (error = e))
		]);

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

		if (chanceOfKnowing > 0.8) {
			offerSuggestions = false;
		}
	}

	$: if (word.id || sentence.id) {
		let wordWas = word;

		const wordStrings = toWords(sentence.sentence, language);

		let wordString = word.word; // fallback

		const wordIndex = sentenceWords.findIndex(({ id }) => id === word.id);

		if (wordIndex >= 0 && sentenceWords.length == wordStrings.length) {
			wordString = wordStrings[wordIndex];
		} else {
			console.warn(
				`Word ${word.word} not found in sentence "${sentence.sentence}" (${sentence.id})`
			);
		}

		lookupUnknownWord(wordString, sentence.id)
			.then((translated) => {
				if (word.word == translated.word && word.id == wordWas.id) {
					wordTranslation = translated.english;
				}
			})
			.catch((e) => {
				console.error(e);
				error = e;
			});
	}

	$: if (sentence.id) {
		clear();
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
			isCorrectLemma: exercise == 'cloze-inflection',
			isCorrectInflection: false,
			isTypo: false
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

			const sw = isPickingInflection
				? inflections.filter((w) => w.startsWith(prefix))
				: prefix.length > 0 && showChars < 100
					? await fetchWordsByPrefix(prefix)
					: [];

			if (oldTypeCount == typeCount) {
				suggestedWords = { type: isPickingInflection ? 'inflection' : 'lemma', words: sw };
			}
		} catch (e) {
			console.error(e);
			error = e;
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
					.catch((e) => (error = e))
					.finally(() => (isLoadingSuggestions = false));
			}

			isPickingInflection = true;
		} else {
			return onAnswer(answered);
		}
	}

	async function onAnswer(answered: string) {
		answered = standardize(answered);

		const conjugatedWord = toWords(sentence.sentence, language)[
			sentenceWords.findIndex((w) => w.id === word.id)
		];

		let isCorrectInflection = answered == conjugatedWord;
		let isAnyInflection = inflections.includes(answered);

		let isCorrectLemma = isCorrectInflection || isAnyInflection;

		evaluation = {
			answered,
			isCorrectLemma,
			isCorrectInflection,
			isTypo: false
		};

		console.log(
			`Answered "${answered}". Correct conjugated: "${conjugatedWord}". isCorrectLemma: ${isCorrectLemma}`
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
				clue: wordTranslation || '',
				userAnswer: answered,
				correctAnswer: {
					id: word.id,
					conjugated: conjugatedWord
				},
				isWrongInflection: !isCorrectInflection && isCorrectLemma
			}).finally(() => (isFetchingEvaluation = false));

			if (word === wordWas) {
				if (gotEvaluation.differentWord) {
					console.log(
						`${gotEvaluation.differentWord?.word} (${gotEvaluation.differentWord?.id}) was unexpected but possible. Expected ${word.word} (${word.id}).`
					);
				}

				evaluation = {
					answered,
					...gotEvaluation
				};
			}
		}
	}

	async function storeAndContinue() {
		if (!evaluation) {
			throw new Error(`Invalid state, evaluation is undefined`);
		}

		const { isCorrectInflection, isCorrectLemma, differentWord } = evaluation;

		sendKnowledge(
			filterUndefineds(
				sentenceWords.map((sentenceWord: DB.Word) => {
					const isClozeWord = sentenceWord.id == word.id;

					if (exercise == 'cloze-inflection' && isClozeWord) {
						return undefined;
					}

					if (isClozeWord && differentWord) {
						sentenceWord = differentWord;
					}

					return {
						word: sentenceWord,
						wordId: sentenceWord.id,
						sentenceId: sentence.id,
						isKnown: isClozeWord
							? isCorrectLemma && !showChars
							: !revealed.find(({ id }) => id === sentenceWord.id),
						studiedWordId: word.id,
						type: isClozeWord ? KNOWLEDGE_TYPE_CLOZE : KNOWLEDGE_TYPE_READ,
						userId: -1
					};
				})
			),
			(!isCorrectInflection && isCorrectLemma) || source == 'userExercise'
				? [
						{
							wordId: word.id,
							word: word.word,
							sentenceId: sentence.id,
							isKnown: !!isCorrectInflection,
							exercise:
								isCorrectInflection && source == 'userExercise'
									? exercise
									: isCorrectLemma
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

<ClozeDumb
	{sentence}
	{word}
	{sentenceWords}
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
	{wordTranslation}
	{sentenceTranslation}
	{mnemonic}
	{showChars}
	{suggestedWords}
	{revealed}
	{language}
	{isLoadingSuggestions}
/>

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
			`They test words you already have a good passive knowledge of.`
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
			revealed
		})}
	wordId={word.id}
	suggestions={[
		'Can I express this differently?',
		`How do you say 'banana' in ${language.name}?`,
		...(revealed.length
			? ['Etymology?', 'Other meanings?', 'Similar-sounding words?', 'Synonyms?', 'Examples?']
			: [])
	]}
/>

<ErrorComponent {error} onClear={() => (error = undefined)} />
