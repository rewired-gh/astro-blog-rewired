/**
 * Global configuration settings for the application
 */

// Determine the current environment
export const isDev = true;
const isLocalhost = false;

// API configuration
export const apiConfig = {
  baseUrl: isLocalhost ? 'http://localhost:8788/api' : '/api',
  endpoints: {
    comments: (postId: string) => `posts/${postId}/comments`,
  }
};

// Site configuration
export const siteConfig = {
  title: 'Blog Rewired',
  url: isLocalhost ? 'http://localhost:4321' : 'https://your-production-url.com',
};

// Default configuration export
export default {
  api: apiConfig,
  site: siteConfig,
  isDev,
};
