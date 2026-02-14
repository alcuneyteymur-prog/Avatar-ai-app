const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const { authMiddleware } = require('./auth');
const router = express.Router();

// Abonelik olustur
router.post('/create-subscription', authMiddleware, async (req, res) => {
  try {
    const { priceId } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    
    let customerId = user.subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: userId.toString() }
      });
      customerId = customer.id;
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });

    user.subscription.stripeCustomerId = customerId;
    user.subscription.stripeSubscriptionId = subscription.id;
    await user.save();

    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    });
  } catch (error) {
    console.error('Abonelik hatasi:', error);
    res.status(500).json({ error: 'Abonelik olusturulamadi' });
  }
});

// Aboneligi iptal et
router.post('/cancel-subscription', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.subscription?.stripeSubscriptionId) {
      return res.status(400).json({ error: 'Aktif abonelik yok' });
    }

    await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId);
    user.subscription.type = 'free';
    user.subscription.stripeSubscriptionId = null;
    await user.save();

    res.json({ message: 'Abonelik iptal edildi' });
  } catch (error) {
    console.error('Iptal hatasi:', error);
    res.status(500).json({ error: 'Abonelik iptal edilemedi' });
  }
});

// Fiyatlari getir
router.get('/prices', async (req, res) => {
  try {
    const prices = await stripe.prices.list({
      lookup_keys: ['premium_monthly', 'family_monthly'],
      expand: ['data.product']
    });

    res.json(prices.data.map(price => ({
      id: price.id,
      name: price.product.name,
      description: price.product.description,
      amount: price.unit_amount / 100,
      currency: price.currency,
      interval: price.recurring.interval
    })));
  } catch (error) {
    res.status(500).json({ error: 'Fiyatlar getirilemedi' });
  }
});

// Webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'invoice.payment_succeeded':
      const subscription = event.data.object;
      const userId = subscription.customer.metadata.userId;
      const priceId = subscription.lines.data[0].price.id;
      const planType = priceId.includes('family') ? 'family' : 'premium';
      
      await User.findByIdAndUpdate(userId, {
        'subscription.type': planType,
        'subscription.expiresAt': new Date(subscription.current_period_end * 1000)
      });
      break;

    case 'invoice.payment_failed':
    case 'customer.subscription.deleted':
      const deletedSub = event.data.object;
      const deletedUserId = deletedSub.customer.metadata.userId;
      await User.findByIdAndUpdate(deletedUserId, { 'subscription.type': 'free' });
      break;
  }

  res.json({ received: true });
});

module.exports = router;
