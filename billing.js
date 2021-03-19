import wrapper from './libs/lambda-lib';
import calculatePrice from './libs/billing-lib';
import stripePkg from "stripe";
import AWS from "aws-sdk";

export const handler = wrapper(async(event, context) => {
    const stripe = stripePkg(process.env.stripeSecret);
    const documentClient = new AWS.DynamoDB.DocumentClient();

    const data = JSON.parse(event.body);

    // Transcript duration in seconds
    const duration = data.duration;

    const queryParams = {
        TableName: process.env.usersTableName,
        Key: {
          userId: event.requestContext.identity.cognitoIdentityId,
        },
    };
    const item = await documentClient.get(queryParams).promise();
    const customerId = item.Item.customerId;
    /*const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
    });*/

    let paymentIntentParams = {
        amount: calculatePrice(duration),
        currency: 'usd',
        customer: customerId
    };

    /*if(paymentMethods.data[0].id) {
        paymentIntentParams.payment_method = paymentMethods.data[0].id;
        console.log("Payment Method Saved: ", paymentMethods.data[0])
        paymentIntentParams.confirm = true;
    }*/

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    return {clientSecret: paymentIntent.client_secret};
});