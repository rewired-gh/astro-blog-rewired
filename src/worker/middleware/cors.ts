import type { MiddlewareHandler } from 'hono';
import { api } from '../utils/api';

export const corsMiddleware: MiddlewareHandler = async (c, next) => {
	if (c.req.method === 'OPTIONS') {
		return api.handleCors();
	}
	await next();
};
