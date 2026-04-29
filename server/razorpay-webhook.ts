import Razorpay from "razorpay";
import crypto from "crypto";
import { Request, Response, Express } from "express";
import express from "express";
import * as db from "./db";

// Get Razorpay credentials from settings (per-company) or env
async function getRazorpayInstance(companyId: number) {
  const keyId = await db.getSetting(companyId, "razorpay_key_id");
  const keySecret = await db.getSetting(companyId, "razorpay_key_secret");
  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured. Please set them in Admin Settings → Payment Gateway.");
  }
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

// Get Razorpay key ID for frontend (public key)
export async function getRazorpayKeyId(companyId: number): Promise<string | null> {
  return await db.getSetting(companyId, "razorpay_key_id");
}

// Create a Razorpay order for plan purchase
export async function createRazorpayOrder(opts: {
  companyId: number;
  plan: string;
  interval: "monthly" | "yearly";
  userId: number;
  userEmail: string;
  userName: string;
}) {
  const { PLANS } = await import("./stripe-products");
  const planConfig = PLANS[opts.plan as keyof typeof PLANS];
  if (!planConfig) throw new Error(`Invalid plan: ${opts.plan}`);

  const amount = opts.interval === "yearly" ? planConfig.yearlyPrice : planConfig.monthlyPrice;
  // amount is already in paise (smallest unit)

  const razorpay = await getRazorpayInstance(opts.companyId);

  const order = await razorpay.orders.create({
    amount: amount,
    currency: "INR",
    receipt: `kukbook_${opts.companyId}_${Date.now()}`,
    notes: {
      company_id: opts.companyId.toString(),
      user_id: opts.userId.toString(),
      plan: opts.plan,
      interval: opts.interval,
      user_email: opts.userEmail,
      user_name: opts.userName,
    },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: await db.getSetting(opts.companyId, "razorpay_key_id"),
    companyName: "KukBook ERP",
    planName: planConfig.name,
    description: `${planConfig.name} Plan — ${opts.interval === "yearly" ? "Yearly" : "Monthly"}`,
    prefill: {
      name: opts.userName,
      email: opts.userEmail,
    },
  };
}

// Verify Razorpay payment signature
export async function verifyRazorpayPayment(opts: {
  companyId: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  plan: string;
  interval: "monthly" | "yearly";
}) {
  const keySecret = await db.getSetting(opts.companyId, "razorpay_key_secret");
  if (!keySecret) throw new Error("Razorpay key secret not configured");

  // Verify signature
  const body = opts.razorpayOrderId + "|" + opts.razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== opts.razorpaySignature) {
    throw new Error("Payment verification failed — invalid signature");
  }

  // Payment verified — activate subscription
  const { PLANS } = await import("./stripe-products");
  const planConfig = PLANS[opts.plan as keyof typeof PLANS];
  const amount = opts.interval === "yearly" ? planConfig.yearlyPrice : planConfig.monthlyPrice;

  const sub = await db.getSubscription(opts.companyId);
  if (sub) {
    const startDate = new Date();
    const endDate = new Date();
    if (opts.interval === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    await db.updateSubscription(sub.id, {
      plan: opts.plan,
      status: "active",
      paymentGateway: "razorpay",
      paymentId: opts.razorpayPaymentId,
      amount: (amount / 100).toFixed(2), // Convert paise to rupees
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
    });
  }

  return { success: true, message: "Payment verified and subscription activated" };
}

// Register Razorpay webhook handler
export function registerRazorpayWebhook(app: Express) {
  app.post(
    "/api/razorpay/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      try {
        const body = typeof req.body === "string" ? req.body : req.body.toString();
        const event = JSON.parse(body);

        console.log(`[Razorpay Webhook] Received event: ${event.event}`);

        switch (event.event) {
          case "payment.captured": {
            const payment = event.payload?.payment?.entity;
            if (payment) {
              const companyId = parseInt(payment.notes?.company_id || "0");
              const plan = payment.notes?.plan || "starter";
              if (companyId) {
                const sub = await db.getSubscription(companyId);
                if (sub && sub.status !== "active") {
                  await db.updateSubscription(sub.id, {
                    plan,
                    status: "active",
                    paymentGateway: "razorpay",
                    paymentId: payment.id,
                    amount: (payment.amount / 100).toFixed(2),
                  });
                  console.log(`[Razorpay Webhook] Subscription activated for company ${companyId}`);
                }
              }
            }
            break;
          }
          case "payment.failed": {
            const payment = event.payload?.payment?.entity;
            console.log(`[Razorpay Webhook] Payment failed: ${payment?.id}`);
            break;
          }
          default:
            console.log(`[Razorpay Webhook] Unhandled event: ${event.event}`);
        }

        return res.json({ received: true });
      } catch (err: any) {
        console.error("[Razorpay Webhook] Error:", err.message);
        return res.status(400).json({ error: err.message });
      }
    }
  );
}
