import { describe, expect, it } from "vitest";
import { orderMatchesContact } from "./orderMatch.ts";

const order = { customer_phone: "9876543210", customer_email: "Aarav@Example.com" };

describe("orderMatchesContact", () => {
  it("matches on phone alone", () => {
    expect(orderMatchesContact(order, "9876543210", undefined)).toBe(true);
  });

  it("matches on email, case-insensitively", () => {
    expect(orderMatchesContact(order, undefined, "aarav@example.com")).toBe(true);
  });

  it("does not match a wrong phone number (anti-enumeration boundary)", () => {
    expect(orderMatchesContact(order, "9999999999", undefined)).toBe(false);
  });

  it("does not match a wrong email", () => {
    expect(orderMatchesContact(order, undefined, "someone-else@example.com")).toBe(false);
  });

  it("does not match when the order is null (order number itself was wrong)", () => {
    expect(orderMatchesContact(null, "9876543210", undefined)).toBe(false);
  });

  it("does not match when neither phone nor email is supplied", () => {
    expect(orderMatchesContact(order, undefined, undefined)).toBe(false);
  });
});
