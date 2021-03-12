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
    const paymentId = item.Item.paymentId;

    const paymentIntent = await stripe.paymentIntents.create({
        amount: calculatePrice(duration),
        currency: 'usd',
        customer: paymentId
    });

    return {clientSecret: paymentIntent.client_secret};
});