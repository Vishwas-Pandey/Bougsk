import { describe, expect, it } from "vitest";
import { resolveRefundAmount } from "./refund.ts";

describe("resolveRefundAmount", () => {
  it("defaults to the full order total when no amount is requested", () => {
    const result = resolveRefundAmount(1549, undefined);
    expect(result).toEqual({ amountInr: 1549 });
  });

  it("allows a partial refund less than the total", () => {
    const result = resolveRefundAmount(1549, 500);
    expect(result).toEqual({ amountInr: 500 });
  });

  it("allows a refund exactly equal to the total", () => {
    const result = resolveRefundAmount(1549, 1549);
    expect(result).toEqual({ amountInr: 1549 });
  });

  it("rejects a refund larger than the order total — the money-critical guard", () => {
    const result = resolveRefundAmount(1549, 2000);
    expect(result).toEqual({ error: "Refund amount cannot exceed the order total" });
  });

  it("rejects a zero or negative amount", () => {
    expect(resolveRefundAmount(1549, 0)).toEqual({
      error: "amount_inr must be a positive number",
    });
    expect(resolveRefundAmount(1549, -100)).toEqual({
      error: "amount_inr must be a positive number",
    });
  });
});
