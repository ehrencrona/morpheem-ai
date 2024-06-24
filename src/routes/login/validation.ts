export const INVALID_USERNAME = `Invalid username: must be 3-30 characters long and only contain letters or digits.`;

export const INVALID_PASSWORD = `Invalid password: must be 6-255 characters long.`;

export function isUsernameValid(username: FormDataEntryValue | null): boolean {
	return (
		typeof username === 'string' &&
		username.length >= 3 &&
		username.length <= 31 &&
		/^[a-zA-Z0-9@\._-]+$/.test(username)
	);
}

export function isPasswordValid(password: FormDataEntryValue | null): boolean {
	return typeof password === 'string' && password.length >= 6 && password.length <= 255;
}
