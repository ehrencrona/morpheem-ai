import type { Session, User } from 'lucia';
import { Language } from './logic/types';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User | null;
			session: Session | null;
			language: Language;
			userId: number | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
