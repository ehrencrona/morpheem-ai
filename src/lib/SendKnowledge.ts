import type { ExerciseKnowledge, WordKnowledge } from '../logic/types';
import * as DB from '../db/types';

export type SendKnowledge = (
	words: (WordKnowledge & { word: DB.Word })[],
	exercises?: ExerciseKnowledge[]
) => void;
