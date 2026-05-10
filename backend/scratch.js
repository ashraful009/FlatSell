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
            currency: 'bdt',
            product_data: { name: 'Test Villa' },
            unit_amount: 100000000, // 1,000,000 BDT
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
