export class CodedError extends Error {
	constructor(
		message: string,
		public code: string,
		public data?: any
	) {
		super(message);
	}
}
