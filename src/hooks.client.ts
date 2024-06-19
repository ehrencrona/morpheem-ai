import { init } from '@sentry/browser';

if (document.location.hostname != 'localhost') {
	init({
		dsn: 'https://f962852f91c7442fb3e1f503735ca05f@app.glitchtip.com/7067',
		tracesSampleRate: 0.01
	});
}
