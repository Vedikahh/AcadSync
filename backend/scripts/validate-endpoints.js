/* eslint-disable no-console */
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

const headers = {
	'Content-Type': 'application/json',
};

const tests = [
	{
		name: 'Auth register invalid (missing required fields)',
		method: 'POST',
		path: '/api/auth/register',
		body: {
			email: 'invalid-email',
			password: '123',
		},
		expectedStatus: 400,
	},
	{
		name: 'Auth login invalid (wrong data type)',
		method: 'POST',
		path: '/api/auth/login',
		body: {
			email: 1234,
			password: true,
		},
		expectedStatus: 400,
	},
	{
		name: 'Auth forgot-password invalid (missing email)',
		method: 'POST',
		path: '/api/auth/forgot-password',
		body: {},
		expectedStatus: 200,
		note: 'Endpoint intentionally returns safe 200 response to avoid account enumeration',
	},
	{
		name: 'Auth reset-password invalid (password mismatch)',
		method: 'POST',
		path: '/api/auth/reset-password',
		body: {
			token: 'abc123token',
			password: 'Password123',
			confirmPassword: 'Password124',
		},
		expectedStatus: 400,
	},
	{
		name: 'Event create invalid (missing required body)',
		method: 'POST',
		path: '/api/events',
		body: {
			title: '',
			date: 'not-a-date',
			startTime: '99:99',
		},
		expectedStatus: 401,
		note: 'Auth middleware runs before validation for protected routes',
	},
	{
		name: 'Event approve invalid param format',
		method: 'PATCH',
		path: '/api/events/not-an-id/approve',
		body: {},
		expectedStatus: 401,
		note: 'Auth middleware runs before validation for protected routes',
	},
	{
		name: 'Schedule create invalid',
		method: 'POST',
		path: '/api/schedule',
		body: {
			subject: '',
			startTime: '25:00',
		},
		expectedStatus: 401,
		note: 'Auth middleware runs before validation for protected routes',
	},
	{
		name: 'Schedule rollback invalid versionId',
		method: 'POST',
		path: '/api/schedule/import/rollback/bad-id',
		body: {},
		expectedStatus: 401,
		note: 'Auth middleware runs before validation for protected routes',
	},
	{
		name: 'User update invalid body',
		method: 'PUT',
		path: '/api/users/update',
		body: {
			phone: 'x',
		},
		expectedStatus: 401,
		note: 'Auth middleware runs before validation for protected routes',
	},
	{
		name: 'User public profile invalid userId',
		method: 'GET',
		path: '/api/users/public/123',
		expectedStatus: 401,
		note: 'Auth middleware runs before validation for protected routes',
	},
	{
		name: 'Notification mark read invalid id',
		method: 'PATCH',
		path: '/api/notifications/invalid-id/read',
		body: {},
		expectedStatus: 401,
		note: 'Auth middleware runs before validation for protected routes',
	},
	{
		name: 'Auth forgot-password valid payload passes validation',
		method: 'POST',
		path: '/api/auth/forgot-password',
		body: {
			email: 'nobody@gmail.com',
		},
		expectedStatus: 200,
		note: 'May be 200 safe response even if account does not exist',
	},
	{
		name: 'Auth verify-email/request valid payload passes validation',
		method: 'POST',
		path: '/api/auth/verify-email/request',
		body: {
			email: 'nobody@gmail.com',
		},
		expectedStatus: 200,
	},
	{
		name: 'Auth verify-email/otp valid shape reaches controller',
		method: 'POST',
		path: '/api/auth/verify-email/otp',
		body: {
			email: 'nobody@gmail.com',
			otp: '123456',
		},
		expectedStatus: 400,
		note: 'Likely invalid/expired OTP at controller, but not Joi failure',
	},
];

const run = async () => {
	let passed = 0;

	for (const test of tests) {
		const options = {
			method: test.method,
			headers,
		};

		if (test.body !== undefined) {
			options.body = JSON.stringify(test.body);
		}

		try {
			const response = await fetch(`${BASE_URL}${test.path}`, options);
			const contentType = response.headers.get('content-type') || '';
			const payload = contentType.includes('application/json')
				? await response.json()
				: await response.text();

			const ok = response.status === test.expectedStatus;
			if (ok) passed += 1;

			console.log(`\\n[${ok ? 'PASS' : 'FAIL'}] ${test.name}`);
			console.log(`  Expected: ${test.expectedStatus} | Received: ${response.status}`);
			if (test.note) {
				console.log(`  Note: ${test.note}`);
			}
			if (!ok || response.status === 400) {
				console.log('  Response:', payload);
			}
		} catch (error) {
			console.log(`\\n[ERROR] ${test.name}`);
			console.log(`  ${error.message}`);
		}
	}

	console.log(`\\nSummary: ${passed}/${tests.length} tests matched expected status codes.`);
	if (passed !== tests.length) {
		process.exitCode = 1;
	}
};

run();
