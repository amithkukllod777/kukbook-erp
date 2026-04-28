import express, { type Express, type Request, type Response } from "express";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import * as db from "./db";

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
    stripe = new Stripe(key);
  }
  return stripe;
}

export function registerStripeWebhook(app: Express) {
  // MUST register BEFORE express.json() — raw body needed for signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig || !webhookSecret) {
        console.error("[Stripe Webhook] Missing signature or webhook secret");
        return res.status(400).json({ error: "Missing signature or webhook secret" });
      }

      let event: Stripe.Event;
      try {
        event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Stripe Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const companyId = session.metadata?.company_id
              ? parseInt(session.metadata.company_id)
              : null;
            const plan = session.metadata?.plan || "starter";
            const stripeCustomerId = session.customer as string;
            const stripeSubscriptionId = session.subscription as string;

            if (companyId) {
              await db.updateSubscription(companyId, {
                plan,
                status: "active",
                paymentGateway: "stripe",
                paymentId: stripeSubscriptionId || stripeCustomerId || "",
              });
              console.log(`[Stripe Webhook] Subscription activated for company ${companyId}, plan: ${plan}`);
            }
            break;
          }

          case "invoice.paid": {
            const invoice = event.data.object as Stripe.Invoice;
            const subId = (invoice as any).subscription as string;
            if (subId) {
              console.log(`[Stripe Webhook] Invoice paid for subscription ${subId}`);
            }
            break;
          }

          case "customer.subscription.updated": {
            const subscription = event.data.object as Stripe.Subscription;
            const status = subscription.status;
            console.log(`[Stripe Webhook] Subscription ${subscription.id} updated to status: ${status}`);
            break;
          }

          case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription;
            console.log(`[Stripe Webhook] Subscription ${subscription.id} cancelled`);
            break;
          }

          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error(`[Stripe Webhook] Error processing ${event.type}:`, err);
      }

      return res.json({ received: true });
    }
  );
}

// Create a Stripe Checkout Session
export async function createCheckoutSession(opts: {
  companyId: number;
  plan: string;
  interval: "monthly" | "yearly";
  userId: number;
  userEmail: string;
  userName: string;
  origin: string;
}) {
  const s = getStripe();
  const { PLANS } = await import("./stripe-products");
  const planConfig = PLANS[opts.plan as keyof typeof PLANS];
  if (!planConfig) throw new Error(`Invalid plan: ${opts.plan}`);

  const unitAmount = opts.interval === "yearly" ? planConfig.yearlyPrice : planConfig.monthlyPrice;

  const session = await s.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: opts.userEmail,
    client_reference_id: opts.userId.toString(),
    allow_promotion_codes: true,
    metadata: {
      company_id: opts.companyId.toString(),
      user_id: opts.userId.toString(),
      customer_email: opts.userEmail,
      customer_name: opts.userName,
      plan: opts.plan,
    },
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: `KukBook ERP — ${planConfig.name}`,
            description: planConfig.description,
          },
          unit_amount: unitAmount,
          recurring: {
            interval: opts.interval === "yearly" ? "year" : "month",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${opts.origin}/subscription?success=true`,
    cancel_url: `${opts.origin}/subscription?cancelled=true`,
  });

  return { url: session.url };
}
