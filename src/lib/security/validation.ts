/**
 * Security validation helpers for API routes.
 */

const MAX_PAYLOAD_SIZE = 50 * 1024; // 50KB limit to prevent DoS attacks

export function isPayloadTooLarge(contentLength: string | null): boolean {
  if (!contentLength) return false;
  const size = parseInt(contentLength, 10);
  return isNaN(size) ? false : size > MAX_PAYLOAD_SIZE;
}

/**
 * Checks if a honeypot field has been filled out.
 * Bots often blindly fill all form fields.
 */
export function isHoneypotTriggered(body: any): boolean {
  // We use a disguised honeypot field name like 'phone_number_optional' or 'website_url'
  // If it's filled out, it's likely a bot.
  return !!body.website_url;
}
