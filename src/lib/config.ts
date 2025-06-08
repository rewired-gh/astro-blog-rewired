/**
 * Global configuration settings for the application
 */

// Determine the current environment
export const isDev = true;
export const isLocalhost = true;

declare global {
  interface Window {
    turnstile: {
      reset: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
      isExpired: (widgetId?: string) => boolean;
      remove: (widgetId?: string) => void;
    };
  }
}

const turnstileTestAlwaysPass = '1x00000000000000000000AA';
const turnstileTestAlwaysBlock = '2x00000000000000000000AB';
export const turnstileTestAlwaysPassSecret = '1x0000000000000000000000000000000AA';
export const turnstileTestAlwaysFailSecret = '2x0000000000000000000000000000000AA';

// Token configuration
export const tokenConfig = {
  turnstileSiteKey: isDev ? turnstileTestAlwaysPass : '0x4AAAAAAA-1N2bI9ZrMgGGX',
};

// API configuration
export const apiConfig = {
  baseUrl: isLocalhost ? 'http://localhost:8788/api' : '/api',
  endpoints: {
    comments: (postId: string) => `posts/${postId}/comments`,
  },
  constraints: {
    maxCommentLength: 560,
  },
};

// Site configuration
export const siteConfig = {
  name: 'Blog Rewired 🍀',
  description: 'Blog rewired.',
  pageTitle: (title: string) => `${title} | ${siteConfig.name}`,
  url: isLocalhost ? 'http://localhost:4321' : 'https://blog.rewired.moe',
};

// Default configuration export
export default {
  api: apiConfig,
  site: siteConfig,
  token: tokenConfig,
  isDev,
  isLocalhost,
};
