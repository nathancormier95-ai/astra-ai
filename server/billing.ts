import type { Request, Response } from "express";
import Stripe from "stripe";

import type { User } from "../drizzle/schema";
import * as db from "./db";

export const PREMIUM_PRICE_CENTS = 600;
export const PREMIUM_PRICE_LABEL = "$6/month";

function requireEnv(name: "OMNIMIND_STRIPE_SECRET_KEY" | "OMNIMIND_STRIPE_PREMIUM_PRICE_ID" | "OMNIMIND_STRIPE_WEBHOOK_SECRET") {
  const value = process.env[name];
  if (!value) throw new Error(`Stripe is not configured: ${name} is missing.`);
  return value;
}

export function getStripe() {
  return new Stripe(requireEnv("OMNIMIND_STRIPE_SECRET_KEY"));
}

function appendResult(returnUrl: string, result: "success" | "cancel") {
  const separator = returnUrl.includes("?") ? "&" : "?";
  return `${returnUrl}${separator}billing=${result}`;
}

function assertReturnUrl(returnUrl: string) {
  const parsed = new URL(returnUrl);
  if (!parsed.protocol.endsWith(":")) throw new Error("A valid return URL is required.");
  return returnUrl;
}

async function ensureStripeCustomer(user: User) {
  const preferences = await db.getPreferences(user.id);
  if (preferences?.stripeCustomerId) return preferences.stripeCustomerId;
  const customer = await getStripe().customers.create({
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    metadata: { omnimindUserId: String(user.id) },
  });
  await db.setStripeCustomerId(user.id, customer.id);
  return customer.id;
}

export async function createCheckoutSession(user: User, returnUrl: string) {
  const priceId = requireEnv("OMNIMIND_STRIPE_PREMIUM_PRICE_ID");
  const customerId = await ensureStripeCustomer(user);
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: String(user.id),
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: appendResult(assertReturnUrl(returnUrl), "success"),
    cancel_url: appendResult(assertReturnUrl(returnUrl), "cancel"),
    allow_promotion_codes: true,
    metadata: { omnimindUserId: String(user.id) },
    subscription_data: { metadata: { omnimindUserId: String(user.id) } },
  });
  if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
  return session.url;
}

export async function createBillingPortalSession(user: User, returnUrl: string) {
  const preferences = await db.getPreferences(user.id);
  if (!preferences?.stripeCustomerId) throw new Error("There is no billing account to manage yet.");
  const session = await getStripe().billingPortal.sessions.create({
    customer: preferences.stripeCustomerId,
    return_url: assertReturnUrl(returnUrl),
  });
  return session.url;
}

function periodEndFromSubscription(subscription: Stripe.Subscription) {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return typeof periodEnd === "number" ? new Date(periodEnd * 1_000) : null;
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  let userId = await db.getUserIdByStripeCustomerId(customerId);
  if (!userId) {
    const metadataUserId = Number(subscription.metadata.omnimindUserId);
    if (Number.isInteger(metadataUserId) && metadataUserId > 0) {
      userId = metadataUserId;
      await db.setStripeCustomerId(userId, customerId);
    }
  }
  if (!userId) return;
  await db.updateStripeSubscription(userId, {
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodEnd: periodEndFromSubscription(subscription),
  });
}

export async function processStripeEvent(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
    const userId = Number(session.client_reference_id ?? session.metadata?.omnimindUserId);
    if (customerId && Number.isInteger(userId) && userId > 0) await db.setStripeCustomerId(userId, customerId);
    if (session.subscription) {
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
      await syncSubscription(await getStripe().subscriptions.retrieve(subscriptionId));
    }
    return;
  }
  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    await syncSubscription(event.data.object as Stripe.Subscription);
  }
}

export async function stripeWebhookHandler(req: Request, res: Response) {
  const signature = req.header("stripe-signature");
  if (!signature) {
    res.status(400).send("Missing Stripe signature");
    return;
  }
  try {
    const event = getStripe().webhooks.constructEvent(req.body, signature, requireEnv("OMNIMIND_STRIPE_WEBHOOK_SECRET"));
    await processStripeEvent(event);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("[Stripe] Webhook rejected or failed", error);
    res.status(400).send("Stripe webhook could not be processed");
  }
}
