import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors';
import { comments } from './routes/comments';
import type { Env } from './types/env';

const app = new Hono<{ Bindings: Env }>();

app.use('*', corsMiddleware);
app.route('/api', comments);

export default app;
