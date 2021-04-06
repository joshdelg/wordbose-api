import wrapper from './libs/lambda-lib';
import stripePkg from "stripe";

export const handler = wrapper(async(event, context) => {
    const stripe = stripePkg(process.env.stripeSecret);

    const data = JSON.parse(event.body);

    // Payment Id
    const paymentId = data.paymentId;

    const refund = await stripe.refunds.create({
        payment_intent: paymentId
    });

    return {refund: refund};
});