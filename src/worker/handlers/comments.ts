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
		const db = c.env.prodDB || c.env.devDB;
		const requestUrl = new URL(c.req.url);

		// Parse and validate page parameter
		const page = parsePageParam(requestUrl.searchParams.get('page') || undefined);
		if (page === null) {
			return api.error('Invalid page parameter');
		}

		// Get total count of comments for this post
		const countResult = await db
			.prepare('SELECT COUNT(*) as total FROM comments WHERE post_id = ?')
			.bind(postId)
			.first<{ total: number }>();

		const totalItems = countResult?.total || 0;

		// Calculate pagination values
		const pagination = calculatePagination({
			page,
			perPage: 15,
			totalItems,
			baseUrl: `${requestUrl.origin}/api/${config.api.endpoints.comments(postId)}`,
		});

		// Return early if page is out of bounds
		if (page > pagination.meta.totalPages && totalItems > 0) {
			return api.error('Page number exceeds available pages');
		}

		// Fetch comments with pagination
		const comments = await db
			.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
			.bind(postId, pagination.limit, pagination.offset)
			.all<CommentModel>();

		// Transform comments from snake_case DB model to camelCase response model
		const transformedComments = transformComments(comments.results);

		// Create response with pagination metadata
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
		const db = c.env.prodDB || c.env.devDB;

		// Parse request body as FormData instead of JSON
		let formData;
		try {
			formData = await c.req.formData();
		} catch (parseError) {
			console.error('Error parsing form data:', parseError);
			return api.error('Invalid form data in request');
		}

		// Create data object for validation
		const data: CommentSubmission = {
			senderName: (formData.get('senderName') as string).trim(),
			senderEmail: ((formData.get('senderEmail') as string) || null)?.trim(),
			content: formData.get('content') as string,
			captchaToken: formData.get('cf-turnstile-response') as string,
		};

		// Validate inputs
		const validation = validateComment(data);
		if (!validation.valid) {
			return api.error(validation.error || 'Invalid comment data');
		}

		// Get client IP address
		const clientIp =
			c.req.header('CF-Connecting-IP') ||
			c.req.header('X-Forwarded-For') ||
			c.req.header('X-Real-IP') ||
			'unknown';
		console.info('Client IP:', clientIp);
		console.info('Captcha token:', data.captchaToken);
		console.info('Form data:', formData);

		// Verify captcha token
		const captchaPass = await verifyCaptcha(
			data.captchaToken,
			clientIp,
			(config.isDev ? turnstileTestAlwaysPassSecret : c.env.TURNSTILE_SECRET) || ''
		);
		if (!captchaPass) {
			return api.error('Security verification failed');
		}

		// Moderate content with OpenAI
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

		// Begin database operations
		try {
			// Check comment count
			const countResult = await db
				.prepare('SELECT COUNT(*) as total FROM comments WHERE post_id = ?')
				.bind(postId)
				.first<{ total: number }>();

			const totalComments = countResult?.total || 0;

			let result: CommentModel | null = null;

			if (totalComments >= 64) {
				// Using batch for multiple operations that need to be atomic
				const batchResult = await db.batch([
					// Delete the oldest comment if we've reached the limit
					db
						.prepare(
							'DELETE FROM comments WHERE id = (SELECT id FROM comments WHERE post_id = ? ORDER BY created_at ASC LIMIT 1)'
						)
						.bind(postId),

					// Insert the new comment with IP
					db
						.prepare(
							'INSERT INTO comments (post_id, sender_name, sender_email, content, ip) VALUES (?, ?, ?, ?, ?) RETURNING id, sender_name, sender_email, content, created_at'
						)
						.bind(postId, data.senderName, data.senderEmail || null, data.content, clientIp),
				]);

				// Get the result from the second statement (the INSERT)
				result = batchResult[1].results[0] as CommentModel;
			} else {
				// Just insert the new comment if we're under the limit
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

			// Transform to camelCase response
			const transformedComment = camelcaseKeys(result as unknown as Record<string, unknown>);

			// Send a notification to the admin
			await sendNewCommentNotification(
				data,
				postId,
				c.env.NOTIFICATION_TELEGRAM_BOT_TOKEN,
				c.env.NOTIFICATION_TELEGRAM_CHAT_ID
			);

			// Return success with the newly created comment
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
	// Check if data is an object
	if (!data || typeof data !== 'object') {
		return { valid: false, error: 'Invalid request format' };
	}

	// Validate name
	if (!data.senderName || typeof data.senderName !== 'string') {
		return { valid: false, error: 'Please provide your name' };
	}

	if (data.senderName.length > 32) {
		return { valid: false, error: 'Name cannot exceed 32 characters' };
	}

	// Validate email (optional but if provided must be valid)
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

	// Validate content
	if (!data.content || typeof data.content !== 'string') {
		return { valid: false, error: 'Comment content cannot be empty' };
	}

	if (data.content.length > config.api.constraints.maxCommentLength) {
		return {
			valid: false,
			error: `Comment cannot exceed ${config.api.constraints.maxCommentLength} characters`,
		};
	}

	// Validate captcha token
	if (!data.captchaToken || typeof data.captchaToken !== 'string') {
		return { valid: false, error: 'Security verification failed' };
	}

	// All validations passed
	return { valid: true };
}
