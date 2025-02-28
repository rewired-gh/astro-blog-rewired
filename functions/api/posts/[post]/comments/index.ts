import { serverConfig } from "../../../../util/config";
import { api } from "../../../../util/api";
import {
  calculatePagination,
  parsePageParam,
} from "../../../../util/pagination";
import {
  CommentListResponse,
  CommentModel,
  CommentResponse,
} from "../../../../../src/types/comments";
import { verifyCaptcha } from "../../../../util/captcha";
import { moderateContent } from "../../../../util/moderation";
import camelcaseKeys from "camelcase-keys";
import snakecaseKeys from "snakecase-keys";
import config, { turnstileTestAlwaysPassSecret } from "../../../../../src/lib/config";

interface Env {
  devDB: D1Database;
  prodDB: D1Database;
  TURNSTILE_SECRET?: string;
  LLM_API_KEY: string;
  LLM_API_ENDPOINT: string;
  LLM_MODEL: string;
}

/**
 * Transform database comments into API response format
 * Converts snake_case to camelCase and removes post_id
 */
function transformComments(comments: CommentModel[]): CommentResponse[] {
  return comments.map(({ post_id, ip, ...rest }) =>
    camelcaseKeys(rest) as unknown as CommentResponse
  );
}

/**
 * Handle GET requests to retrieve comments for a post
 */
async function handleGetComments(
  db: D1Database,
  postId: string,
  requestUrl: URL,
): Promise<Response> {
  try {
    // Parse and validate page parameter
    const page = parsePageParam(requestUrl.searchParams.get("page"));
    if (page === null) {
      return api.error("Invalid page parameter");
    }

    // Get total count of comments for this post
    const countResult = await db.prepare(
      "SELECT COUNT(*) as total FROM comments WHERE post_id = ?",
    ).bind(postId).first<{ total: number }>();

    const totalItems = countResult?.total || 0;

    // Calculate pagination values
    const pagination = calculatePagination({
      page,
      perPage: serverConfig.commentsPerPage,
      totalItems,
      baseUrl: `${requestUrl.origin}/api/${
        config.api.endpoints.comments(postId)
      }`,
    });

    // Return early if page is out of bounds
    if (page > pagination.meta.totalPages && totalItems > 0) {
      return api.error("Page number exceeds available pages");
    }

    // Fetch comments with pagination
    const comments = await db.prepare(
      "SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
    ).bind(postId, pagination.limit, pagination.offset).all<CommentModel>();

    // Transform comments from snake_case DB model to camelCase response model
    const transformedComments = transformComments(comments.results);

    // Create response with pagination metadata
    const response: CommentListResponse = {
      comments: transformedComments,
      pagination: pagination.meta,
    };

    return api.success(response);
  } catch (error) {
    console.error("Error retrieving comments:", error);
    return api.serverError("Failed to retrieve comments");
  }
}

/**
 * Handle POST requests to add a new comment
 */
async function handlePostComment(
  db: D1Database,
  postId: string,
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    // Parse request body as FormData instead of JSON
    let formData;
    try {
      formData = await request.formData();
    } catch (parseError) {
      console.error("Error parsing form data:", parseError);
      return api.error("Invalid form data in request");
    }

    // Extract data from form
    const sender_name = formData.get("senderName") as string;
    const sender_email = formData.get("senderEmail") as string || null;
    const content = formData.get("content") as string;
    const captcha_token = formData.get("cf-turnstile-response") as string;

    // Create data object for validation
    const data = {
      sender_name,
      sender_email,
      content,
      captcha_token
    };

    // Validate inputs
    const validation = validateComment(data);
    if (!validation.valid) {
      return api.error(validation.error || "Invalid comment data");
    }

    // Get client IP address
    const clientIp =  request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For") ||
      request.headers.get("X-Real-IP") ||
      "unknown";
    console.info("Client IP:", clientIp);
    console.info("Captch token:", captcha_token);
    console.info("Form data:", formData);

    // Verify captcha token
    const captchaPass = await verifyCaptcha(
      captcha_token,
      clientIp,
      config.isDev ? turnstileTestAlwaysPassSecret : env.TURNSTILE_SECRET || "",
    );
    if (!captchaPass) {
      return api.error("Security verification failed");
    }

    // Trim content
    const trimmedContent = content.trim();

    // Moderate content with OpenAI
    const moderationPass = await moderateContent(
      sender_name,
      sender_email,
      trimmedContent,
      env.LLM_API_ENDPOINT,
      env.LLM_API_KEY,
      env.LLM_MODEL,
    );

    if (!moderationPass) {
      return api.error("Your comment could not be accepted.");
    }

    // Begin database operations
    try {
      // Check comment count
      const countResult = await db.prepare(
        "SELECT COUNT(*) as total FROM comments WHERE post_id = ?",
      ).bind(postId).first<{ total: number }>();

      const totalComments = countResult?.total || 0;

      let result: CommentModel | null = null;

      if (totalComments >= 64) {
        // Using batch for multiple operations that need to be atomic
        const batchResult = await db.batch([
          // Delete the oldest comment if we've reached the limit
          db.prepare(
            "DELETE FROM comments WHERE id = (SELECT id FROM comments WHERE post_id = ? ORDER BY created_at ASC LIMIT 1)",
          ).bind(postId),

          // Insert the new comment with IP
          db.prepare(
            "INSERT INTO comments (post_id, sender_name, sender_email, content, ip) VALUES (?, ?, ?, ?, ?) RETURNING id, sender_name, sender_email, content, created_at",
          ).bind(
            postId,
            sender_name,
            sender_email || null,
            trimmedContent,
            clientIp,
          ),
        ]);

        // Get the result from the second statement (the INSERT)
        result = batchResult[1].results[0] as CommentModel;
      } else {
        // Just insert the new comment if we're under the limit
        const insertResult = await db.prepare(
          "INSERT INTO comments (post_id, sender_name, sender_email, content, ip) VALUES (?, ?, ?, ?, ?) RETURNING id, sender_name, sender_email, content, created_at",
        ).bind(
          postId,
          sender_name,
          sender_email || null,
          trimmedContent,
          clientIp,
        ).first<CommentModel>();

        result = insertResult;
      }

      if (!result) {
        throw new Error("Failed to insert comment");
      }

      // Transform to camelCase response
      const transformedComment = camelcaseKeys(result);

      // Return success with the newly created comment
      return api.success({
        commentId: transformedComment.id,
      });
    } catch (dbError) {
      console.error("Database operation failed:", dbError);
      return api.serverError(
        "We encountered an issue saving your comment. Please try again later.",
      );
    }
  } catch (error) {
    console.error("Error processing comment submission:", error);
    return api.serverError(
      "An unexpected error occurred. Please try again later.",
    );
  }
}

/**
 * Validate the comment submission data
 */
function validateComment(data): { valid: boolean; error?: string } {
  // Check if data is an object
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Invalid request format" };
  }

  // Validate name
  if (
    !data.sender_name || typeof data.sender_name !== "string" ||
    data.sender_name.trim().length === 0
  ) {
    return { valid: false, error: "Please provide your name" };
  }

  if (data.sender_name.length > 32) {
    return { valid: false, error: "Name cannot exceed 32 characters" };
  }

  // Validate email (optional but if provided must be valid)
  if (data.sender_email !== null && data.sender_email !== undefined) {
    if (typeof data.sender_email !== "string") {
      return { valid: false, error: "Email must be a string" };
    }

    if (data.sender_email.trim() !== "") {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(data.sender_email)) {
        return { valid: false, error: "Please provide a valid email address" };
      }
    }

    if (data.sender_email.length > 64) {
      return {
        valid: false,
        error: "Email address cannot exceed 64 characters",
      };
    }
  }

  // Validate content
  if (
    !data.content || typeof data.content !== "string" ||
    data.content.trim().length === 0
  ) {
    return { valid: false, error: "Comment content cannot be empty" };
  }

  if (data.content.length > config.api.constraints.maxCommentLength) {
    return {
      valid: false,
      error:
        `Comment cannot exceed ${config.api.constraints.maxCommentLength} characters`,
    };
  }

  // Validate captcha token
  if (!data.captcha_token || typeof data.captcha_token !== "string") {
    return { valid: false, error: "Security verification failed" };
  }

  // All validations passed
  return { valid: true };
}

/**
 * Main request handler that routes to the appropriate method handler
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const method = context.request.method;
  const postId = context.params.post as string;
  const db = config.isDev ? context.env.devDB : context.env.prodDB;
  const url = new URL(context.request.url);

  // Handle CORS preflight requests
  if (method === "OPTIONS") {
    return api.handleCors();
  }

  switch (method) {
    case "GET":
      return handleGetComments(db, postId, url);

    case "POST":
      return handlePostComment(
        db,
        postId,
        context.request as unknown as Request,
        context.env,
      );

    default:
      return api.methodNotAllowed();
  }
};
