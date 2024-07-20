import { POLISH } from '../../constants';
import { getSentences } from '../../db/sentences';
import { readFromFile, saveToFile } from './syllabus';

let sentences = readFromFile();

const existing = await getSentences(POLISH);

sentences = sentences.filter((s) => {
	return !existing.find((e) => e.sentence == s.sentence);
});

saveToFile(sentences);
