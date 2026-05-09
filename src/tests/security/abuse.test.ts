import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit } from "../../lib/security/rate-limit";
import { isPayloadTooLarge, isHoneypotTriggered } from "../../lib/security/validation";

describe("Abuse Protection", () => {
  describe("Rate Limiting", () => {
    beforeEach(() => {
      // Clear the module cache or internal store if we exported a clear function,
      // but for this simple test we can just use different IPs
    });

    it("should allow requests under the limit", () => {
      const ip = "192.168.1.1";
      for (let i = 0; i < 9; i++) {
        expect(checkRateLimit(ip)).toBe(true);
      }
    });

    it("should block requests over the limit", () => {
      const ip = "192.168.1.2";
      for (let i = 0; i < 10; i++) {
        checkRateLimit(ip);
      }
      expect(checkRateLimit(ip)).toBe(false);
    });
  });

  describe("Validation", () => {
    it("should block oversized payloads", () => {
      expect(isPayloadTooLarge("1000")).toBe(false);
      expect(isPayloadTooLarge("100000000")).toBe(true);
      expect(isPayloadTooLarge(null)).toBe(false);
    });

    it("should trap honeypot fields", () => {
      expect(isHoneypotTriggered({ email: "test@test.com" })).toBe(false);
      expect(isHoneypotTriggered({ email: "test@test.com", website_url: "http://spam.com" })).toBe(true);
    });
  });
});
