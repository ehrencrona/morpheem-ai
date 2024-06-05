import { describe, test } from 'vitest';
import { expectedKnowledge } from './knowledge';

describe('knowledge', () => {
	const inTen = { now: 10, lastTime: 0 };
	const inOne = { now: 1, lastTime: 0 };

	test.only('deleteme', () => {
		for (const alpha of [0, 1]) {
			for (const beta of [null, 0, 1]) {
				console.log(
					{ alpha, beta },
					expectedKnowledge(
						{
							alpha,
							beta,
							lastTime: 0
						},
						{ now: 4700, exercise: 'read' }
					)
				);
			}
		}
	});

	// test('is lost slower if you did know', () => {
	// 	expect(expectedKnowledge(knewFirst('read'), inOne)).toBeCloseTo(1);
	// });

	// test('is long term after knowing twice', () => {
	// 	expect(
	// 		expectedKnowledge(knew(knewFirst('read'), inTen), { now: 20, lastTime: 10 })
	// 	).toBeCloseTo(1);
	// });

	// test('is bad after failing twice', () => {
	// 	expect(
	// 		expectedKnowledge(didNotKnow(didNotKnowFirst('read'), inTen), { now: 100, lastTime: 10 })
	// 	).toBeLessThan(0.25);
	// });

	// test('is ok-ish after failing once', () => {
	// 	expect(
	// 		expectedKnowledge(
	// 			{ ...didNotKnowFirst('read'), lastTime: 10 },
	// 			{
	// 				now: 100,exercise:'read'
	// 			}
	// 		)
	// 	).toBeGreaterThan(0.25);
	// });

	// test('improves if you repeat', () => {
	// 	expect(
	// 		expectedKnowledge({...knew(didNotKnowFirst(), inTen), {
	// 			now: 20,
	// 			lastTime: 10
	// 		})
	// 	).toBeGreaterThan(expectedKnowledge(didNotKnowFirst(), { now: 20, lastTime: 0 }));
	// });

	// test('improves more if you knew', () => {
	// 	expect(
	// 		expectedKnowledge(knew(didNotKnowFirst(), inTen), {
	// 			now: 20,
	// 			lastTime: 10
	// 		})
	// 	).toBeGreaterThan(
	// 		expectedKnowledge(didNotKnow(didNotKnowFirst(), inTen), {
	// 			now: 20,
	// 			lastTime: 10
	// 		})
	// 	);
	// });

	// test('gain is lower when you knew', () => {
	// 	const a = calculateRepetitionValue(knewFirst(), {
	// 		now: 101,
	// 		lastTime: 100
	// 	});

	// 	const b = calculateRepetitionValue(didNotKnowFirst(), {
	// 		now: 101,
	// 		lastTime: 100
	// 	});

	// 	expect(b).toBeGreaterThan(a);
	// });

	// test('gain is zero right after you knew', () => {
	// 	const gainRightAfterKnowing = calculateRepetitionValue(knewFirst(), inOne);

	// 	expect(gainRightAfterKnowing).toBeLessThan(0.1);

	// 	const gainRightAfterNotKnowing = calculateRepetitionValue(didNotKnowFirst(), inOne);

	// 	expect(gainRightAfterNotKnowing).toBeLessThan(0.1);

	// 	expect(gainRightAfterNotKnowing).toBeGreaterThan(gainRightAfterKnowing);
	// });

	// test('gain is lower right after asking', () => {
	// 	const earlier = calculateRepetitionValue(didNotKnowFirst(), inOne);

	// 	const later = calculateRepetitionValue(didNotKnowFirst(), inTen);

	// 	expect(earlier).toBeLessThan(later);
	// });

	// test('benefit of asking things you did not know lasts', () => {
	// 	const inOneDay = {
	// 		now: 24 * 60,
	// 		lastTime: 0
	// 	};

	// 	expect(calculateRepetitionValue(didNotKnowFirst(), inOneDay)).toBeGreaterThan(
	// 		calculateRepetitionValue(knewFirst(), inOneDay)
	// 	);
	// });

	// test('is gained only marginally if you already knew', () => {
	// 	expect(
	// 		calculateRepetitionValue(
	// 			{
	// 				alpha: 1,
	// 				beta: 3039
	// 			},
	// 			{
	// 				now: 300,
	// 				lastTime: 0
	// 			}
	// 		)
	// 	).toBeLessThan(0.1);
	// });
});
