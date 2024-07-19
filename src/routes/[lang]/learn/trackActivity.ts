import { sendMinuteSpent } from '../api/knowledge/minutes-spent/client';

export function trackActivity(_node: Node) {
	let userActive = false;
	let lastActivityTime = Date.now();

	document.addEventListener('mousemove', updateUserActivity);
	document.addEventListener('keydown', updateUserActivity);

	function updateUserActivity() {
		userActive = true;
		lastActivityTime = Date.now();
	}

	async function sendActivityRequest() {
		if (userActive) {
			await sendMinuteSpent();

			userActive = false;
		}
	}

	const timer = setInterval(sendActivityRequest, 60000);

	return {
		destroy() {
			clearInterval(timer);
			document.removeEventListener('mousemove', updateUserActivity);
			document.removeEventListener('keydown', updateUserActivity);
		}
	};
}
