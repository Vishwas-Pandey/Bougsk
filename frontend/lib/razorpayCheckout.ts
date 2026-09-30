// Thin wrapper around Razorpay's Standard Checkout script — loads it once,
// then opens the payment modal and resolves/rejects based on what the
// customer actually did (paid, dismissed the modal, or a hard failure).
// See https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open(): void };
  }
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let scriptLoadPromise: Promise<void> | null = null;

function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error("Could not load the Razorpay payment script. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });
  return scriptLoadPromise;
}

export class RazorpayDismissedError extends Error {
  constructor() {
    super("Payment window closed before completing.");
    this.name = "RazorpayDismissedError";
  }
}

export async function openRazorpayCheckout(options: {
  keyId: string;
  razorpayOrderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}): Promise<RazorpaySuccessResponse> {
  await loadCheckoutScript();
  if (!window.Razorpay) {
    throw new Error("Razorpay checkout script did not load correctly.");
  }

  return new Promise((resolve, reject) => {
    const razorpay = new window.Razorpay!({
      key: options.keyId,
      order_id: options.razorpayOrderId,
      name: "Bougsk",
      description: "Order payment",
      prefill: {
        name: options.customerName,
        email: options.customerEmail,
        contact: options.customerPhone,
      },
      theme: { color: "#8A2D3B" },
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new RazorpayDismissedError()),
      },
    });
    razorpay.open();
  });
}
