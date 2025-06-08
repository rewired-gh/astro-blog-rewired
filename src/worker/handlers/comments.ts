import { api } from '../utils/api';
import { calculatePagination, parsePageParam } from '../utils/pagination';
import type {
	CommentListResponse,
	CommentModel,
	CommentResponse,
	CommentSubmission,
} from '../../types/comments';
import { verifyCaptcha } from '../utils/captcha';
import { moderateContent } from '../utils/moderation';
import camelcaseKeys from 'camelcase-keys';
import config, { turnstileTestAlwaysPassSecret } from '../../lib/config';
import { sendNewCommentNotification } from '../utils/notification';
import type { Env } from '../types/env';
import type { Context } from 'hono';

/**
 * Transform database comments into API response format
 * Converts snake_case to camelCase and removes post_id
 */
function transformComments(comments: CommentModel[]): CommentResponse[] {
	return comments.map(
		({ post_id, ip, ...rest }) => camelcaseKeys(rest) as unknown as CommentResponse
	);
}

/**
 * Handle GET requests to retrieve comments for a post
 */
export async function getComments(c: Context<{ Bindings: Env }>): Promise<Response> {
	try {
		const postId = c.req.param('post');
		const db = config.isDev ? c.env.devDB : c.env.prodDB;
		const requestUrl = new URL(c.req.url);

		const page = parsePageParam(requestUrl.searchParams.get('page') || undefined);
		if (page === null) {
			return api.error('Invalid page parameter');
		}

		const countResult = await db
			.prepare('SELECT COUNT(*) as total FROM comments WHERE post_id = ?')
			.bind(postId)
			.first<{ total: number }>();

		const totalItems = countResult?.total || 0;

		const pagination = calculatePagination({
			page,
			perPage: 15,
			totalItems,
			baseUrl: `${requestUrl.origin}/api/${config.api.endpoints.comments(postId)}`,
		});

		if (page > pagination.meta.totalPages && totalItems > 0) {
			return api.error('Page number exceeds available pages');
		}

		const comments = await db
			.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
			.bind(postId, pagination.limit, pagination.offset)
			.all<CommentModel>();

		const transformedComments = transformComments(comments.results);

		const response: CommentListResponse = {
			comments: transformedComments,
			pagination: pagination.meta,
		};

		return api.success(response);
	} catch (error) {
		console.error('Error retrieving comments:', error);
		return api.serverError('Failed to retrieve comments');
	}
}

/**
 * Handle POST requests to add a new comment
 */
export async function createComment(c: Context<{ Bindings: Env }>): Promise<Response> {
	try {
		const postId = c.req.param('post');
		const db = config.isDev ? c.env.devDB : c.env.prodDB;

		let formData;
		try {
			formData = await c.req.formData();
		} catch (parseError) {
			console.error('Error parsing form data:', parseError);
			return api.error('Invalid form data in request');
		}

		const data: CommentSubmission = {
			senderName: (formData.get('senderName') as string).trim(),
			senderEmail: ((formData.get('senderEmail') as string) || null)?.trim(),
			content: formData.get('content') as string,
			captchaToken: formData.get('cf-turnstile-response') as string,
		};

		const validation = validateComment(data);
		if (!validation.valid) {
			return api.error(validation.error || 'Invalid comment data');
		}

		const clientIp =
			c.req.header('CF-Connecting-IP') ||
			c.req.header('X-Forwarded-For') ||
			c.req.header('X-Real-IP') ||
			'unknown';
		console.info('Client IP:', clientIp);
		console.info('Captcha token:', data.captchaToken);
		console.info('Form data:', formData);

		const captchaPass = await verifyCaptcha(
			data.captchaToken,
			clientIp,
			(config.isDev ? turnstileTestAlwaysPassSecret : c.env.TURNSTILE_SECRET) || ''
		);
		if (!captchaPass) {
			return api.error('Security verification failed');
		}

		const moderationPass = await moderateContent(
			data.senderName,
			data.senderEmail || '',
			data.content,
			c.env.LLM_API_ENDPOINT,
			c.env.LLM_API_KEY,
			c.env.LLM_MODEL,
			c.env.LLM_DATA_TAG
		);

		if (!moderationPass) {
			return api.error('Your comment was rejected.');
		}

		try {
			const countResult = await db
				.prepare('SELECT COUNT(*) as total FROM comments WHERE post_id = ?')
				.bind(postId)
				.first<{ total: number }>();

			const totalComments = countResult?.total || 0;

			let result: CommentModel | null = null;

			if (totalComments >= 64) {
				const batchResult = await db.batch([
					db
						.prepare(
							'DELETE FROM comments WHERE id = (SELECT id FROM comments WHERE post_id = ? ORDER BY created_at ASC LIMIT 1)'
						)
						.bind(postId),
					db
						.prepare(
							'INSERT INTO comments (post_id, sender_name, sender_email, content, ip) VALUES (?, ?, ?, ?, ?) RETURNING id, sender_name, sender_email, content, created_at'
						)
						.bind(postId, data.senderName, data.senderEmail || null, data.content, clientIp),
				]);

				result = batchResult[1].results[0] as CommentModel;
			} else {
				const insertResult = await db
					.prepare(
						'INSERT INTO comments (post_id, sender_name, sender_email, content, ip) VALUES (?, ?, ?, ?, ?) RETURNING id, sender_name, sender_email, content, created_at'
					)
					.bind(postId, data.senderName, data.senderEmail || null, data.content, clientIp)
					.first<CommentModel>();

				result = insertResult;
			}

			if (!result) {
				throw new Error('Failed to insert comment');
			}

			const transformedComment = camelcaseKeys(result as unknown as Record<string, unknown>);

			await sendNewCommentNotification(
				data,
				postId,
				c.env.NOTIFICATION_TELEGRAM_BOT_TOKEN,
				c.env.NOTIFICATION_TELEGRAM_CHAT_ID
			);

			return api.success({
				commentId: transformedComment.id,
			});
		} catch (dbError) {
			console.error('Database operation failed:', dbError);
			return api.serverError('We encountered an issue saving your comment.');
		}
	} catch (error) {
		console.error('Error processing comment submission:', error);
		return api.serverError('An unexpected error occurred.');
	}
}

/**
 * Validate the comment submission data
 */
function validateComment(data: CommentSubmission): { valid: boolean; error?: string } {
	if (!data || typeof data !== 'object') {
		return { valid: false, error: 'Invalid request format' };
	}

	if (!data.senderName || typeof data.senderName !== 'string') {
		return { valid: false, error: 'Please provide your name' };
	}

	if (data.senderName.length > 32) {
		return { valid: false, error: 'Name cannot exceed 32 characters' };
	}

	if (data.senderEmail !== null && data.senderEmail !== undefined) {
		if (typeof data.senderEmail !== 'string') {
			return { valid: false, error: 'Email must be a string' };
		}

		if (data.senderEmail) {
			const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailPattern.test(data.senderEmail)) {
				return { valid: false, error: 'Please provide a valid email address' };
			}
		}

		if (data.senderEmail.length > 64) {
			return {
				valid: false,
				error: 'Email address cannot exceed 64 characters',
			};
		}
	}

	if (!data.content || typeof data.content !== 'string') {
		return { valid: false, error: 'Comment content cannot be empty' };
	}

	if (data.content.length > config.api.constraints.maxCommentLength) {
		return {
			valid: false,
			error: `Comment cannot exceed ${config.api.constraints.maxCommentLength} characters`,
		};
	}

	if (!data.captchaToken || typeof data.captchaToken !== 'string') {
		return { valid: false, error: 'Security verification failed' };
	}

	return { valid: true };
}
