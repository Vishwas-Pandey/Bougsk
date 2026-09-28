export function formatCurrency(amountInr: number): string {
  return `₹${Math.round(amountInr).toLocaleString("en-IN")}`;
}
