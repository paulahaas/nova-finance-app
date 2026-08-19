// Stripe integration (section 35). Checkout + Billing Portal are used
// instead of building a custom card form — Stripe hosts the payment page,
// so card data never touches this app. Firestore (via firebase-admin) is
// the source of truth for subscription state; the webhook below is the
// only thing allowed to write plan: "pro" for a real (non-demo) purchase.

import Stripe from 'stripe';
import { adminDb, isFirebaseAdminConfigured } from './firebaseAdmin.js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const priceId = process.env.STRIPE_PRICE_ID;
const appUrl = process.env.APP_URL || 'http://localhost:5173';

export const isStripeConfigured = Boolean(stripeSecretKey && priceId);
export const isWebhookConfigured = Boolean(webhookSecret);

const stripe = isStripeConfigured ? new Stripe(stripeSecretKey) : null;

async function getOrCreateCustomer({ uid, email }) {
  const userRef = adminDb.collection('users').doc(uid);
  const userSnap = await userRef.get();
  const existingId = userSnap.data()?.stripeCustomerId;

  if (existingId) return existingId;

  const customer = await stripe.customers.create({ email, metadata: { firebaseUID: uid } });
  await userRef.update({ stripeCustomerId: customer.id });
  return customer.id;
}

export async function createCheckoutSession({ uid, email }) {
  if (!isStripeConfigured) throw new Error('Stripe is not configured');
  if (!isFirebaseAdminConfigured) throw new Error('Firebase Admin is not configured (needed to store the Stripe customer id)');

  const customerId = await getOrCreateCustomer({ uid, email });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/app/profile?checkout=success`,
    cancel_url: `${appUrl}/pro?checkout=canceled`,
    metadata: { firebaseUID: uid },
    subscription_data: { metadata: { firebaseUID: uid } },
  });

  return { url: session.url };
}

export async function createBillingPortalSession({ uid }) {
  if (!isStripeConfigured) throw new Error('Stripe is not configured');
  const userSnap = await adminDb.collection('users').doc(uid).get();
  const customerId = userSnap.data()?.stripeCustomerId;
  if (!customerId) throw new Error('No Stripe customer on file for this user yet');

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/app/profile`,
  });

  return { url: session.url };
}

function planFromSubscriptionStatus(status) {
  return status === 'active' || status === 'trialing' ? 'pro' : 'free';
}

async function syncSubscriptionToFirestore(subscription) {
  const uid = subscription.metadata?.firebaseUID;
  if (!uid) {
    console.warn('[stripe] subscription event missing firebaseUID metadata, skipping', subscription.id);
    return;
  }
  await adminDb.collection('users').doc(uid).update({
    plan: planFromSubscriptionStatus(subscription.status),
    subscriptionStatus: subscription.status,
    subscriptionId: subscription.id,
    subscriptionStart: new Date(subscription.current_period_start * 1000).toISOString(),
    subscriptionEnd: subscription.cancel_at_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
  });
}

export async function handleWebhookEvent(rawBody, signature) {
  if (!isWebhookConfigured) throw new Error('Stripe webhook secret is not configured');
  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        await syncSubscriptionToFirestore(subscription);
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.created':
      await syncSubscriptionToFirestore(event.data.object);
      break;
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const uid = subscription.metadata?.firebaseUID;
      if (uid) {
        await adminDb.collection('users').doc(uid).update({
          plan: 'free',
          subscriptionStatus: 'canceled',
          subscriptionEnd: new Date().toISOString(),
        });
      }
      break;
    }
    default:
      break; // ignore events we don't act on
  }

  return event;
}
