import type { Gamma } from '../types';

export function expectedKnowledge(
	{ alpha, beta }: Gamma,
	{ now, lastTime }: { now: number; lastTime: number }
) {
	return Math.pow(1 + (now - lastTime) / beta, -alpha);
}

export function decayRate({ alpha, beta }: Gamma) {
	return alpha / beta;
}

/** If we ask this now, how much more will I know in the future than I otherwise would? */
export function knowledgeGain(params: Gamma, { now, lastTime }: { now: number; lastTime: number }) {
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
	return { alpha: 0.25, beta: 30 };
}

export function knewFirst() {
	return { alpha: 1, beta: 3000 };
}

export function didNotKnow(
	{ alpha, beta }: Gamma,
	{ now, lastTime }: { now: number; lastTime: number }
) {
	return { alpha: alpha + 1, beta: beta + (now - lastTime) };
}

export function knew({ alpha, beta }: Gamma, { now, lastTime }: { now: number; lastTime: number }) {
	return { alpha: alpha, beta: beta + (now - lastTime) };
}

const startOfTime = new Date(2024, 0, 1).getTime();

const timeScaling = 60 * 1000;

export function dateToTime(date: Date) {
	return Math.round((date.getTime() - startOfTime) / timeScaling);
}

export function now() {
	return dateToTime(new Date());
}
