/**
 * Global configuration settings for the application
 */

// Determine the current environment
export const isDev = true;
export const isLocalhost = false;

// Token configuration
export const tokenConfig = {
  turnstileSiteKey: '0x4AAAAAAA-1N2bI9ZrMgGGX',
};

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
  token: tokenConfig,
  isDev,
  isLocalhost
};
