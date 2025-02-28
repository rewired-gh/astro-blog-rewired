/**
 * Global configuration settings for the application
 */

// Determine the current environment
export const isDev = true;
export const isLocalhost = false;

declare global {
  interface Window {
    onTurnstileResolved: (token: string) => void;
  }
}

const turnstileTestAlwaysPass = '1x00000000000000000000AA'
const turnstileTestAlwaysBlock = '2x00000000000000000000AB'
export const turnstileTestAlwaysPassSecret = '1x0000000000000000000000000000000AA'
export const turnstileTestAlwaysFailSecret = '2x0000000000000000000000000000000AA'

// Token configuration
export const tokenConfig = {
  turnstileSiteKey:  isDev ? turnstileTestAlwaysPass : '0x4AAAAAAA-1N2bI9ZrMgGGX',
};

// API configuration
export const apiConfig = {
  baseUrl: isLocalhost ? 'http://localhost:8788/api' : '/api',
  endpoints: {
    comments: (postId: string) => `posts/${postId}/comments`,
  },
  constraints: {
    maxCommentLength: 560,
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
