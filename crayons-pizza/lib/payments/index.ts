import { createChaseProvider } from "./chase.ts";
import { createMockProvider } from "./mock.ts";
import { createStripeProvider } from "./stripe.ts";
import type { PaymentProvider } from "./types.ts";

export type { PaymentProvider, CheckoutRequest, CheckoutSession, PaidOrder, WebhookResult } from "./types.ts";

/**
 * Picks the provider from the environment.
 *   PAYMENT_PROVIDER=stripe   (default when STRIPE_SECRET_KEY is set)
 *   PAYMENT_PROVIDER=chase
 *   PAYMENT_PROVIDER=mock     (default when no keys are set; refused in production)
 */
export function getPaymentProvider(): PaymentProvider {
  const env = process.env;
  const choice = (env.PAYMENT_PROVIDER || (env.STRIPE_SECRET_KEY ? "stripe" : "mock")).toLowerCase();

  switch (choice) {
    case "stripe": {
      if (!env.STRIPE_SECRET_KEY) throw new Error("PAYMENT_PROVIDER=stripe but STRIPE_SECRET_KEY is not set");
      return createStripeProvider(env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET);
    }
    case "chase":
      return createChaseProvider({ merchantId: env.CHASE_MERCHANT_ID, apiKey: env.CHASE_API_KEY });
    case "mock": {
      if (env.NODE_ENV === "production" && env.ALLOW_MOCK_PAYMENTS !== "true") {
        throw new Error(
          "No payment provider is configured. Set STRIPE_SECRET_KEY (or ALLOW_MOCK_PAYMENTS=true for a demo deploy).",
        );
      }
      return createMockProvider(env.MOCK_PAYMENT_SECRET || "dev-only-secret-change-me");
    }
    default:
      throw new Error(`Unknown PAYMENT_PROVIDER "${choice}"`);
  }
}

/** Name of the active provider, safe to show in the UI. */
export function paymentProviderName(): string {
  try {
    return getPaymentProvider().name;
  } catch {
    return "none";
  }
}
