import { describe, expect, it } from "vitest";

describe("Stripe server credential", () => {
  it("authenticates against Stripe's lightweight account endpoint", async () => {
    const secretKey = process.env.OMNIMIND_STRIPE_SECRET_KEY;
    expect(secretKey).toMatch(/^sk_(test|live)_/);

    const response = await fetch("https://api.stripe.com/v1/account", {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    expect(response.ok).toBe(true);
    const account = (await response.json()) as { id?: string; object?: string };
    expect(account.object).toBe("account");
    expect(account.id).toMatch(/^acct_/);
  }, 30_000);

  it("retrieves the configured OmniMind Premium monthly price", async () => {
    const secretKey = process.env.OMNIMIND_STRIPE_SECRET_KEY;
    const priceId = process.env.OMNIMIND_STRIPE_PREMIUM_PRICE_ID;
    expect(priceId).toMatch(/^price_/);

    const response = await fetch(`https://api.stripe.com/v1/prices/${priceId}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    expect(response.ok).toBe(true);
    const price = (await response.json()) as { active?: boolean; currency?: string; unit_amount?: number; recurring?: { interval?: string } };
    expect(price.active).toBe(true);
    expect(price.currency).toBe("usd");
    expect(price.unit_amount).toBe(600);
    expect(price.recurring?.interval).toBe("month");
  }, 30_000);
});
