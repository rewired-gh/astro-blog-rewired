import config from '../../lib/config';
import type { ExecutionContext } from '@cloudflare/workers-types';

interface ErrorResponse {
	error: string;
}

interface ApiResponseOptions extends ResponseInit {
	headers?: HeadersInit;
}

/**
 * Get appropriate headers based on environment
 */
function getHeaders(additionalHeaders: HeadersInit = {}) {
	const baseHeaders = {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': config.isLocalhost
			? '*'
			: 'https://*blog-rewired-worker.neut.workers.dev',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Max-Age': '86400', // 24 hours cache for preflight requests
	};

	return new Headers({
		...baseHeaders,
		...additionalHeaders,
	});
}

export const api = {
	success: <T>(data: T, options: ApiResponseOptions = {}) => {
		return new Response(JSON.stringify(data), {
			status: 200,
			headers: getHeaders(options.headers),
			...options,
		});
	},

	successCached: <T>(data: T, options: ApiResponseOptions = {}) => {
		return new Response(JSON.stringify(data), {
			status: 200,
			headers: getHeaders({
				'Cache-Control': 'max-age=60',
				...(options.headers || {}),
			}),
			...options,
		});
	},

	error: (message: string, status = 400) => {
		const body: ErrorResponse = { error: message };
		return new Response(JSON.stringify(body), {
			status,
			headers: getHeaders(),
		});
	},

	methodNotAllowed: () => {
		return new Response(JSON.stringify({ error: 'Method not allowed' }), {
			status: 405,
			headers: getHeaders(),
		});
	},

	serverError: (message = 'Internal server error') => {
		const body: ErrorResponse = { error: message };
		return new Response(JSON.stringify(body), {
			status: 500,
			headers: getHeaders(),
		});
	},

	handleCors: () => {
		return new Response(null, {
			status: 204,
			headers: getHeaders(),
		});
	},
};
