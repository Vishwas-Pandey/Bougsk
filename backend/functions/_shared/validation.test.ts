import { describe, expect, it } from "vitest";
import { isValidPhone, isValidPincode } from "./validation.ts";

describe("isValidPhone", () => {
  it("accepts a valid 10-digit Indian mobile number", () => {
    expect(isValidPhone("9876543210")).toBe(true);
    expect(isValidPhone("6000000000")).toBe(true);
  });

  it("rejects numbers not starting with 6-9", () => {
    expect(isValidPhone("5876543210")).toBe(false);
    expect(isValidPhone("0876543210")).toBe(false);
  });

  it("rejects the wrong length", () => {
    expect(isValidPhone("987654321")).toBe(false); // 9 digits
    expect(isValidPhone("98765432100")).toBe(false); // 11 digits
  });

  it("rejects non-digit characters (a landline-style +91 prefix, spaces, etc.)", () => {
    expect(isValidPhone("+919876543210")).toBe(false);
    expect(isValidPhone("98765 43210")).toBe(false);
  });
});

describe("isValidPincode", () => {
  it("accepts a 6-digit pincode", () => {
    expect(isValidPincode("110084")).toBe(true);
  });

  it("rejects the wrong length", () => {
    expect(isValidPincode("11008")).toBe(false);
    expect(isValidPincode("1100841")).toBe(false);
  });

  it("rejects non-digit characters", () => {
    expect(isValidPincode("11OO84")).toBe(false);
  });
});
