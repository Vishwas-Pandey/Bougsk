// Pure "does this contact info match this order" predicate for track-order —
// the one place a stranger can probe for someone else's order, so getting
// this comparison right (and knowing it never leaks which factor mismatched
// through anything other than the response) is worth its own test.
export interface OrderContact {
  customer_phone: string;
  customer_email: string | null;
}

export function orderMatchesContact(
  order: OrderContact | null,
  phone: string | undefined,
  email: string | undefined,
): boolean {
  if (!order) return false;
  const phoneMatches = !!phone && order.customer_phone === phone;
  const emailMatches = !!email && order.customer_email?.toLowerCase() === email.toLowerCase();
  return phoneMatches || emailMatches;
}
