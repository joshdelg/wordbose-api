import createResponse from './libs/response-lib';
import stripePkg from "stripe";

const calculatePrice = (seconds) => {
    // Currency in smallest amount
    // Price: (Assuming minutes is above free threshold) 10c per minute
    // Min charge of 50c so for testing just adding 50 to price
    const totalMins = Math.round(seconds / 60);
    const chargedMins = totalMins - 15;
    const price = (chargedMins * 10) + 50;

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