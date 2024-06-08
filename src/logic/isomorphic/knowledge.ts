import type { ExerciseSource, Knowledge, Scoreable } from '../../db/types';
import type { ExerciseType } from '../types';

const kn = 1.1;
export const nt = 0.2;
const f = 0.3;

const a = 9.59244224e-1;
const b = -2.33071243e-2;
const c = 3.28301466e-5;

const [forgetting, correction] = [0, 0.01644545, 0.0077873];

export function expectedKnowledge(
	{ alpha, beta, lastTime }: Knowledge,
	{ now, exercise }: { now: number; exercise: ExerciseType }
) {
	const knowledge = exercise == 'read' ? alpha : beta != null ? beta : alpha / 2;

	let age = now - lastTime;

	if (age < 0) {
		console.warn('Negative age', { now, lastTime });
		age = 0;
	}

	const time = Math.log(age + Math.E);

	return Math.min(Math.max(knowledge - forgetting * time + correction, 0), 1);
}

/** Previous best fit */
export function expectedKnowledgeOld({ alpha, lastTime }: Knowledge, { now }: { now: number }) {
	const k = a * alpha + b;

	return Math.min(Math.max(k - 2 * (1 - k) * c * (now - lastTime), 0), 1);
}

// function valueFunction(time: number, optimalTime: number, sigma: number) {
// 	return Math.exp(-Math.pow(Math.log(time) - Math.log(optimalTime), 2) / (2 * Math.pow(sigma, 2)));
// }

function valueFunction(
	time: number,
	optimalTime: number,
	sigma: number,
	stretchForgetting: number
): number {
	const stretchedTime =
		time <= optimalTime ? time : optimalTime + (time - optimalTime) / stretchForgetting;

	return Math.exp(-(Math.log(stretchedTime / optimalTime) ** 2) / (2 * sigma ** 2));
}

/** How much is it worth to repeat this word now? */
export function calculateRepetitionValue(
	{ alpha, beta, lastTime, source }: Scoreable & { source: ExerciseSource },
	{
		now,
		exercise,
		repetitionTime,
		pastDue
	}: { now: number; exercise: ExerciseType; repetitionTime?: number; pastDue?: number }
) {
	let knowledge: number;

	if (source == 'unstudied') {
		if (exercise == 'read') {
			knowledge = nt;
			lastTime = now - 7 * 24 * 60;
		} else {
			return 0;
		}
	} else {
		knowledge =
			exercise == 'read'
				? Math.max(alpha, beta || 0)
				: alpha > 0.8 || beta != null
					? beta || nt
					: -1;

		if (knowledge == -1) {
			return 0;
		}
	}

	const optimalTime = calculateOptimalTime(knowledge, repetitionTime);

	const time = now - lastTime;

	return valueFunction(time, optimalTime, 4, [1 / 25, 1 / 5, 1, 5, 25][(pastDue || 0) + 2]);
}

export function calculateOptimalTime(knowledge: number, repetitionTime: number | undefined) {
	return Math.round(Math.exp(knowledge * (12 + 2 * (repetitionTime || 0))));
}

export function didNotKnowFirst(exercise: ExerciseType) {
	if (exercise != 'read') {
		return {
			alpha: nt,
			beta: nt
		};
	}

	return { alpha: nt, beta: null };
}

export function knewFirst(exercise: ExerciseType) {
	if (exercise != 'read') {
		return {
			alpha: kn,
			beta: kn
		};
	}

	return { alpha: kn, beta: null };
}

export function didNotKnow(
	{ alpha, beta, lastTime }: Knowledge,
	{ now, exercise }: { now: number; exercise: ExerciseType }
) {
	if (exercise == 'read') {
		return { alpha: (1 - f) * alpha + f * nt, beta };
	} else if (beta != null) {
		return { alpha, beta: (1 - f) * beta + f * nt };
	} else {
		return { alpha, beta: nt };
	}
}

export function knew(
	{ alpha, beta, lastTime }: Knowledge,
	{ now, exercise }: { now: number; exercise: ExerciseType }
) {
	if (exercise == 'read') {
		return { alpha: Math.min((1 - f) * alpha + f * kn, 1), beta };
	} else if (beta != null) {
		return { alpha, beta: Math.min((1 - f) * beta + f * kn, 1) };
	} else {
		return { alpha, beta: kn };
	}
}

const startOfTime = 1704034800000;

const timeScaling = 60 * 1000;

export function dateToTime(date: Date) {
	return Math.round((date.getTime() - startOfTime) / timeScaling);
}

export function now() {
	return dateToTime(new Date());
}
