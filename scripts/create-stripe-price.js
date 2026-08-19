// One-time setup helper: creates the "NOVA Pro" Product + a recurring
// monthly Price in your Stripe account (using PLANS.pro.price.monthly from
// src/config/plans.js, so it never drifts from what the app displays),
// then prints the STRIPE_PRICE_ID to paste into your .env.
//
// Usage:
//   STRIPE_SECRET_KEY=sk_test_... node scripts/create-stripe-price.js
//
// Safe to re-run — if a Price with the same lookup_key already exists, it
// reuses it instead of creating a duplicate.

import Stripe from 'stripe';
import { PLANS, PLAN_IDS } from '../src/config/plans.js';

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error('Set STRIPE_SECRET_KEY before running this script.');
  process.exit(1);
}

const stripe = new Stripe(secretKey);
const LOOKUP_KEY = 'nova_pro_monthly';

async function main() {
  const existing = await stripe.prices.list({ lookup_keys: [LOOKUP_KEY], limit: 1 });
  if (existing.data.length > 0) {
    console.log(`Price already exists: ${existing.data[0].id}`);
    console.log(`Set STRIPE_PRICE_ID=${existing.data[0].id} in your .env`);
    return;
  }

  const product = await stripe.products.create({ name: PLANS[PLAN_IDS.PRO].name });
  const price = await stripe.prices.create({
    product: product.id,
    currency: 'brl',
    unit_amount: Math.round(PLANS[PLAN_IDS.PRO].price.monthly * 100),
    recurring: { interval: 'month' },
    lookup_key: LOOKUP_KEY,
  });

  console.log(`Created product ${product.id} and price ${price.id}`);
  console.log(`Set STRIPE_PRICE_ID=${price.id} in your .env`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
