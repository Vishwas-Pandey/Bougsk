const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(amountInRupees: number): string {
  return inrFormatter.format(amountInRupees);
}
