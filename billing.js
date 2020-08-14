import createResponse from './libs/response-lib';
import stripePkg from "stripe";

const calculatePrice = (seconds) => {
    // Currency in smallest amount
    // Assume route only called if transcript is over threshold
    // Price: 10c per min after free threshold (15 mins) with a minimum of 50c
    const totalMins = Math.floor(seconds / 60);
    const chargedMins = totalMins - 15;
    const price = Math.max(50, chargedMins * 10);

    return price;
};

export async function handler(event, context) {
    const stripe = stripePkg(process.env.stripeSecret);

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