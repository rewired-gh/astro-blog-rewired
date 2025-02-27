interface ErrorResponse {
  error: string;
}

const isDev = true;

/**
 * Get appropriate headers based on environment
 */
function getHeaders(additionalHeaders = {}) {
  const baseHeaders = { 
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
  
  // Add CORS headers in development for local testing
  if (isDev) {
    return {
      ...baseHeaders,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours cache for preflight requests
    };
  }
  
  return baseHeaders;
}

export const api = {
  success: <T>(data: T, options: ResponseInit = {}) => {
    return new Response(
      JSON.stringify(data),
      { 
        status: 200,
        headers: getHeaders(options.headers || {}),
        ...options,
      }
    );
  },

  successCached: <T>(data: T, options: ResponseInit = {}) => {
    return new Response(
      JSON.stringify(data),
      { 
        status: 200,
        headers: getHeaders({ 'Cache-Control': 'max-age=60', ...(options.headers || {}) }),
        ...options,
      }
    );
  },
  
  error: (message: string, status = 400) => {
    const body: ErrorResponse = { error: message };
    return new Response(
      JSON.stringify(body),
      { 
        status, 
        headers: getHeaders() 
      }
    );
  },
  
  methodNotAllowed: () => {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: getHeaders() 
      }
    );
  },
  
  serverError: (message = 'Internal server error') => {
    const body: ErrorResponse = { error: message };
    return new Response(
      JSON.stringify(body),
      { 
        status: 500, 
        headers: getHeaders() 
      }
    );
  },
  
  // Add a dedicated CORS preflight handler
  handleCors: () => {
    return new Response(null, {
      status: 204,
      headers: getHeaders()
    });
  }
};
