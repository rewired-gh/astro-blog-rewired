import { api } from './util/api';

export const onRequest = [corsMiddleware];

/**
 * Middleware to handle CORS requests
 */
async function corsMiddleware(context) {
  // Handle preflight OPTIONS requests
  if (context.request.method === 'OPTIONS') {
    return api.handleCors();
  }

  // Continue processing the request
  return context.next();
}
