import wrapper from './libs/lambda-lib';
import stripePkg from "stripe";
import AWS from "aws-sdk";

export const handler = wrapper(async(event, context) => {
    const stripe = stripePkg(process.env.stripeSecret);
    const documentClient = new AWS.DynamoDB.DocumentClient();

    // Email
    const data = JSON.parse(event.body);
    const paymentMethodId = data.paymentMethodId;

    const queryParams = {
        TableName: process.env.usersTableName,
        Key: {
          userId: event.requestContext.identity.cognitoIdentityId,
        },
    };

    const item = await documentClient.get(queryParams).promise();
    const customerId = item.Item.customerId;

    await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
    });

    return {status: true};
});