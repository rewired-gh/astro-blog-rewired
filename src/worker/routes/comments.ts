import { Hono } from 'hono';
import { getComments, createComment } from '../handlers/comments';
import type { Env } from '../types/env';

const comments = new Hono<{ Bindings: Env }>();

comments.get('/posts/:post/comments', getComments);
comments.post('/posts/:post/comments', createComment);

export { comments };
