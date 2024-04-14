import type { z } from 'zod';

export function zodParse<T>(object: string, schema: z.ZodType<T, any>) {
	try {
		return schema.parse(JSON.parse(object));
	} catch (error) {
		console.error(`Object was\n${JSON.stringify(object, null, 2)}`);

		throw error;
	}
}
