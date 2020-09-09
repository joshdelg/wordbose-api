import wrapper from './libs/lambda-lib';
import calculatePrice from './libs/billing-lib';
import stripePkg from "stripe";

export const handler = wrapper(async(event, context) => {
    const stripe = stripePkg(process.env.stripeSecret);

    const data = JSON.parse(event.body);

    // Transcript duration in seconds
    const duration = data.duration;

    const paymentIntent = await stripe.paymentIntents.create({
        amount: calculatePrice(duration),
        currency: 'usd'
    });

    return {clientSecret: paymentIntent.client_secret};
});