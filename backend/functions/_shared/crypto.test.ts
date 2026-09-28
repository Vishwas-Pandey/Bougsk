import { describe, expect, it } from "vitest";
import { hmacSha256Hex, timingSafeEqual } from "./crypto.ts";

describe("hmacSha256Hex", () => {
  it("produces a stable, deterministic hex digest for the same secret+message", async () => {
    const a = await hmacSha256Hex("secret", "order_123|pay_456");
    const b = await hmacSha256Hex("secret", "order_123|pay_456");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes when the message changes (a tampered payment id must not verify)", async () => {
    const a = await hmacSha256Hex("secret", "order_123|pay_456");
    const b = await hmacSha256Hex("secret", "order_123|pay_999");
    expect(a).not.toBe(b);
  });

  it("changes when the secret changes (this is what verify-payment relies on)", async () => {
    const a = await hmacSha256Hex("secret-a", "order_123|pay_456");
    const b = await hmacSha256Hex("secret-b", "order_123|pay_456");
    expect(a).not.toBe(b);
  });
});

describe("timingSafeEqual", () => {
  it("returns true for identical strings", () => {
    expect(timingSafeEqual("abc123", "abc123")).toBe(true);
  });

  it("returns false for a mismatched signature", () => {
    expect(timingSafeEqual("abc123", "abc124")).toBe(false);
  });

  it("returns false when lengths differ, without throwing", () => {
    expect(timingSafeEqual("short", "a-lot-longer-string")).toBe(false);
  });

  it("returns false against an empty string (no accidental short-circuit to true)", () => {
    expect(timingSafeEqual("abc123", "")).toBe(false);
  });
});
