// Pure amount-resolution logic for refund-order, pulled out of the Edge
// Function so the money-critical "how much do we actually refund" decision
// can be unit tested without a database or a Razorpay call.
export type RefundResolution = { amountInr: number } | { error: string };

export function resolveRefundAmount(
  totalInr: number,
  requestedAmountInr: number | undefined,
): RefundResolution {
  const amountInr = requestedAmountInr ?? totalInr;
  if (amountInr <= 0) {
    return { error: "amount_inr must be a positive number" };
  }
  if (amountInr > totalInr) {
    return { error: "Refund amount cannot exceed the order total" };
  }
  return { amountInr };
}
