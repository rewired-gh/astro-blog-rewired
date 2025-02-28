import type { PaginationMeta } from '../../src/types/comments';

export interface PaginationParams {
  page: number;
  perPage: number;
  totalItems: number;
  baseUrl: string;
}

interface PaginationResult {
  limit: number;
  offset: number;
  meta: PaginationMeta;
}

/**
 * Parse and validate page parameter from query string
 */
export function parsePageParam(pageParam: string | null): number | null {
  if (!pageParam) return 1;
  
  const page = parseInt(pageParam, 10);
  if (isNaN(page) || page < 1) {
    return null;
  }
  
  return page;
}

/**
 * Calculate pagination values and metadata
 */
export function calculatePagination(params: PaginationParams): PaginationResult {
  const { page, perPage, totalItems, baseUrl } = params;
  
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(page, totalPages);
  const limit = perPage;
  const offset = (currentPage - 1) * perPage;
  
  // Generate next/prev page URLs
  const nextPage = currentPage < totalPages 
    ? `${baseUrl}?page=${currentPage + 1}` 
    : null;
    
  const prevPage = currentPage > 1 
    ? `${baseUrl}?page=${currentPage - 1}` 
    : null;
  
  // Create pagination metadata using camelCase
  const meta: PaginationMeta = {
    currentPage,
    totalItems,
    totalPages,
    nextPage,
    prevPage
  };
  
  return {
    limit,
    offset,
    meta
  };
}
