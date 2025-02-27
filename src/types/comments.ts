/**
 * Comment types shared between frontend and backend
 */

// Database comment model (snake_case)
export interface CommentModel {
  id: string;
  post_id: string;
  sender_name: string;
  sender_email: string | null;
  ip: string | null;
  content: string;
  created_at: string;
}

// Frontend comment model (camelCase)
export interface Comment {
  id: string;
  senderName: string;
  senderEmail: string | null;
  content: string;
  createdAt: string;
}

// API response comment (excludes post_id)
export interface CommentResponse {
  id: string;
  senderName: string;
  senderEmail: string | null;
  content: string;
  createdAt: string;
}

// Pagination metadata
export interface PaginationMeta {
  currentPage: number;
  totalItems: number;
  totalPages: number;
  nextPage: string | null;
  prevPage: string | null;
}

// Comment list response
export interface CommentListResponse {
  comments: CommentResponse[];
  pagination: PaginationMeta;
}

// Comment submission data
export interface CommentSubmission {
  senderName: string;
  senderEmail?: string | null;
  content: string;
  captchaToken: string;
}

// Comment submission success response
export interface CommentSubmissionResponse {
  commentId: string;
}