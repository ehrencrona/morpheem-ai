import { describe, expect, test } from 'vitest';
import {
	decayRate,
	didNotKnow,
	didNotKnowFirst,
	expectedKnowledge,
	knew,
	knewFirst,
	knowledgeGain
} from './knowledge';

describe('knowledge', () => {
	const inTen = { now: 10, lastTime: 0 };
	const inOne = { now: 1, lastTime: 0 };

	test('is lost slower if you did know', () => {
		expect(expectedKnowledge(knewFirst(), inOne)).toBeCloseTo(1);

		expect(decayRate(didNotKnowFirst())).toBeGreaterThan(decayRate(knewFirst()));
	});

	test('is long term after knowing twice', () => {
		expect(expectedKnowledge(knew(knewFirst(), inTen), { now: 20, lastTime: 10 })).toBeCloseTo(1);
	});

	test('is bad after failing twice', () => {
		expect(
			expectedKnowledge(didNotKnow(didNotKnowFirst(), inTen), { now: 100, lastTime: 10 })
		).toBeLessThan(0.25);
	});

	test('is ok-ish after failing once', () => {
		expect(
			expectedKnowledge(didNotKnowFirst(), {
				now: 100,
				lastTime: 10
			})
		).toBeGreaterThan(0.25);
	});

	test('improves if you repeat', () => {
		expect(
			expectedKnowledge(knew(didNotKnowFirst(), inTen), {
				now: 20,
				lastTime: 10
			})
		).toBeGreaterThan(expectedKnowledge(didNotKnowFirst(), { now: 20, lastTime: 0 }));

		expect(decayRate(knew(didNotKnowFirst(), inTen))).toBeLessThan(decayRate(didNotKnowFirst()));
	});

	test('improves more if you knew', () => {
		expect(decayRate(knew(didNotKnowFirst(), inTen))).toBeLessThan(
			decayRate(didNotKnow(didNotKnowFirst(), inTen))
		);

		expect(
			expectedKnowledge(knew(didNotKnowFirst(), inTen), {
				now: 20,
				lastTime: 10
			})
		).toBeGreaterThan(
			expectedKnowledge(didNotKnow(didNotKnowFirst(), inTen), {
				now: 20,
				lastTime: 10
			})
		);
	});

	test('gain is lower when you knew', () => {
		const a = knowledgeGain(knewFirst(), {
			now: 101,
			lastTime: 100
		});

		const b = knowledgeGain(didNotKnowFirst(), {
			now: 101,
			lastTime: 100
		});

		expect(b).toBeGreaterThan(a);
	});

	test('gain is zero right after you knew', () => {
		const gainRightAfterKnowing = knowledgeGain(knewFirst(), inOne);

		expect(gainRightAfterKnowing).toBeLessThan(0.1);

		const gainRightAfterNotKnowing = knowledgeGain(didNotKnowFirst(), inOne);

		expect(gainRightAfterNotKnowing).toBeLessThan(0.1);

		expect(gainRightAfterNotKnowing).toBeGreaterThan(gainRightAfterKnowing);
	});

	test('gain is lower right after asking', () => {
		const earlier = knowledgeGain(didNotKnowFirst(), inOne);

		const later = knowledgeGain(didNotKnowFirst(), inTen);

		expect(earlier).toBeLessThan(later);
	});

	test('benefit of asking things you did not know lasts', () => {
		const inOneDay = {
			now: 24 * 60,
			lastTime: 0
		};

		expect(knowledgeGain(didNotKnowFirst(), inOneDay)).toBeGreaterThan(
			knowledgeGain(knewFirst(), inOneDay)
		);
	});

	test('is gained only marginally if you already knew', () => {
		expect(
			knowledgeGain(
				{
					alpha: 1,
					beta: 3039
				},
				{
					now: 300,
					lastTime: 0
				}
			)
		).toBeLessThan(0.1);
	});
});
