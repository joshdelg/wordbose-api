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
    let customerId = item.Item.customerId;

    if(!customerId) {
        const name = item.Item.name;
        const email = item.Item.email;

        const customer = await stripe.customers.create({
            name: name,
            email: email
        });

        customerId = customer.id;

        const updateParams = {
            TableName: process.env.usersTableName,
            Key: {
              userId: event.requestContext.identity.cognitoIdentityId,
            },
            UpdateExpression: 'set customerId = :c',
            ExpressionAttributeValues: {
              ':c': customerId
            },
            ReturnValues: 'ALL_NEW'
          };

          await documentClient.update(updateParams).promise();
    }

    let paymentIntentParams = {
        amount: calculatePrice(duration),
        currency: 'usd',
        customer: customerId
    };

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    return {clientSecret: paymentIntent.client_secret};
});