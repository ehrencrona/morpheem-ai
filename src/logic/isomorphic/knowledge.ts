import type { AlphaBetaTime, Exercise } from '../types';

const kn = 1.1;
const nt = 0.2;
const f = 0.3;

const a = 9.59244224e-1;
const b = -2.33071243e-2;
const c = 3.28301466e-5;

const [forgetting, correction] = [0, 0.01644545, 0.0077873];

export function expectedKnowledge(
	{ alpha, beta, lastTime }: AlphaBetaTime,
	{ now, exercise }: { now: number; exercise: Exercise }
) {
	const knowledge = exercise == 'read' ? alpha : beta || 0;
	const time = Math.log(now - lastTime + Math.E);

	return Math.min(Math.max(knowledge - forgetting * time + correction, 0), 1);
}

/** Previous best fit */
export function expectedKnowledgeOld({ alpha, lastTime }: AlphaBetaTime, { now }: { now: number }) {
	const k = a * alpha + b;

	return Math.min(Math.max(k - 2 * (1 - k) * c * (now - lastTime), 0), 1);
}

function valueFunction(time: number, optimalTime: number, sigma: number) {
	return Math.exp(-Math.pow(Math.log(time) - Math.log(optimalTime), 2) / (2 * Math.pow(sigma, 2)));
}

/** How much is it worth to repeat this word now? */
export function calculateRepetitionValue(
	{ alpha, beta, lastTime }: AlphaBetaTime,
	{ now, exercise }: { now: number; exercise: Exercise }
) {
	const knowledge = exercise == 'read' ? alpha : alpha > 0.8 ? beta || nt : 0;

	if (knowledge == 0) {
		return 0;
	}

	const optimalTime = Math.exp(knowledge * 11);

	const time = now - lastTime;

	return valueFunction(time, optimalTime, 1);
}

export function didNotKnowFirst(exercise: Exercise) {
	if (exercise != 'read') {
		return {
			alpha: nt,
			beta: nt
		};
	}

	return { alpha: nt, beta: null };
}

export function knewFirst(exercise: Exercise) {
	if (exercise != 'read') {
		return {
			alpha: kn,
			beta: kn
		};
	}

	return { alpha: kn, beta: null };
}

export function didNotKnow(
	{ alpha, beta, lastTime }: AlphaBetaTime,
	{ now, exercise }: { now: number; exercise: Exercise }
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
	{ alpha, beta, lastTime }: AlphaBetaTime,
	{ now, exercise }: { now: number; exercise: Exercise }
) {
	if (exercise == 'read') {
		return { alpha: Math.min((1 - f) * alpha + f * kn, 1), beta: null };
	} else if (beta != null) {
		return { alpha, beta: Math.min((1 - f) * beta + f * kn, 1) };
	} else {
		return { alpha, beta: kn };
	}
}

const startOfTime = new Date(2024, 0, 1).getTime();

const timeScaling = 60 * 1000;

export function dateToTime(date: Date) {
	return Math.round((date.getTime() - startOfTime) / timeScaling);
}

export function now() {
	return dateToTime(new Date());
}
