import { Hono } from 'hono';
import { getComments, createComment } from '../handlers/comments';
import type { Env } from '../types/env';

const comments = new Hono<{ Bindings: Env }>();

// GET /posts/:post/comments - Retrieve comments for a post
comments.get('/posts/:post/comments', getComments);

// POST /posts/:post/comments - Create a new comment for a post
comments.post('/posts/:post/comments', createComment);

export { comments };
