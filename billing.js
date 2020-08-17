import createResponse from './libs/response-lib';
import calculatePrice from './libs/billing-lib';
import stripePkg from "stripe";

export async function handler(event, context) {
    const stripe = stripePkg(process.env.stripeSecret);
    console.log("Stripe Key", process.env.stripeSecret);

    const data = JSON.parse(event.body);

    // Transcript duration in seconds
    const duration = data.duration;

    try {
        // Create stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: calculatePrice(duration),
            currency: 'usd'
        });

        console.log('Payment intent created successfully:', paymentIntent.id, paymentIntent.amount);
        return createResponse(200, JSON.stringify({clientSecret: paymentIntent.client_secret}));
    } catch (err) {
        console.log(err);
        return createResponse(500, JSON.stringify({status: false}));
    }
}