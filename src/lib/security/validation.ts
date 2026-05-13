const MAX_PAYLOAD_SIZE = 50 * 1024;

export function isPayloadTooLarge(contentLength: string | null): boolean {
  if (!contentLength) return false;
  const size = parseInt(contentLength, 10);
  return isNaN(size) ? false : size > MAX_PAYLOAD_SIZE;
}

export function isHoneypotTriggered(body: Record<string, unknown>): boolean {
  return !!body.website_url;
}
