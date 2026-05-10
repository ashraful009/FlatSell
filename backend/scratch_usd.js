require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function test() {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Test Villa USD' },
            unit_amount: 10000000, // 100,000 USD
          },
          quantity: 1,
        },
      ],
      success_url: 'http://localhost/success',
      cancel_url: 'http://localhost/cancel',
    });
    console.log('Success:', session.id);
  } catch (error) {
    console.error('Stripe Error:', error.message);
  }
}

test();
