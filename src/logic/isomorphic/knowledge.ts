import type { AlphaBeta } from '../types';

const kn = 1.1;
const nt = 0.2;
const f = 0.3;

const a = 9.59244224e-1;
const b = -2.33071243e-2;
const c = 3.28301466e-5;

export function expectedKnowledge(
	{ alpha, beta }: AlphaBeta,
	{ now, lastTime }: { now: number; lastTime: number }
) {
	const k = a * alpha + b;

	return Math.min(Math.max(k - 2 * (1 - k) * c * (now - lastTime), 0), 1);
}

/** If we ask this now, how much more will I know in the future than I otherwise would? */
export function knowledgeGain(
	params: AlphaBeta,
	{ now, lastTime }: { now: number; lastTime: number }
) {
	const chanceOfKnowing = expectedKnowledge(params, { now: now, lastTime });

	const future = 3 * 60;

	const futureTime = {
		now: now + future,
		lastTime: now
	};

	const nowTime = { now, lastTime };

	const knowledgeIfKnew = expectedKnowledge(knew(params, nowTime), futureTime);
	const knowledgeIfNotKnew = expectedKnowledge(didNotKnow(params, nowTime), futureTime);
	const knowledgeOtherwise = expectedKnowledge(params, {
		now: now + future,
		lastTime
	});

	// console.log({
	// 	chanceOfKnowing,
	// 	knowledgeIfKnew,
	// 	knowledgeIfNotKnew,
	// 	knowledgeOtherwise
	// });

	return (
		chanceOfKnowing * knowledgeIfKnew +
		(1 - chanceOfKnowing) * knowledgeIfNotKnew -
		knowledgeOtherwise
	);
}

export function didNotKnowFirst() {
	return { alpha: 0, beta: null };
}

export function knewFirst() {
	return { alpha: 1, beta: null };
}

export function didNotKnow(
	{ alpha, beta }: AlphaBeta,
	{ now, lastTime }: { now: number; lastTime: number }
) {
	return { alpha: (1 - f) * alpha + nt, beta: null };
}

export function knew(
	{ alpha, beta }: AlphaBeta,
	{ now, lastTime }: { now: number; lastTime: number }
) {
	return { alpha: (1 - f) * alpha + f * kn, beta: null };
}

const startOfTime = new Date(2024, 0, 1).getTime();

const timeScaling = 60 * 1000;

export function dateToTime(date: Date) {
	return Math.round((date.getTime() - startOfTime) / timeScaling);
}

export function now() {
	return dateToTime(new Date());
}
