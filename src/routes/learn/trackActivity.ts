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

	// Function to send fetch request
	async function sendActivityRequest() {
		if (userActive) {
			await sendMinuteSpent();

			// Reset userActive status
			userActive = false;
		}
	}

	// Set interval to check user activity every minute
	setInterval(sendActivityRequest, 60000);

	return {
		destroy() {
			document.removeEventListener('mousemove', updateUserActivity);
			document.removeEventListener('keydown', updateUserActivity);
		}
	};
}
