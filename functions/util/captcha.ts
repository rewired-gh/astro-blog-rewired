interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  error_codes?: string[];
  action?: string;
  cdata?: string;
}

/**
 * Verifies a Cloudflare Turnstile captcha token
 * 
 * @param token The captcha token to verify
 * @param ip The IP address of the client
 * @param secret The Turnstile secret key
 * @returns A boolean indicating whether the token is valid
 */
export async function verifyCaptcha(
  token: string,
  ip: string,
  secret: string
): Promise<boolean> {
  const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  
  // Use FormData instead of JSON
  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  formData.append("remoteip", ip);
  
  const result = await fetch(url, {
    body: formData,
    method: 'POST',
  });
  
  const outcome = await result.json() as TurnstileVerifyResponse;
  return outcome?.success || false;
}
