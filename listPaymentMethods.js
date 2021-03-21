import wrapper from './libs/lambda-lib';
import stripePkg from "stripe";
import AWS from "aws-sdk";

export const handler = wrapper(async(event, context) => {
    const stripe = stripePkg(process.env.stripeSecret);
    const documentClient = new AWS.DynamoDB.DocumentClient();

    const queryParams = {
        TableName: process.env.usersTableName,
        Key: {
          userId: event.requestContext.identity.cognitoIdentityId,
        },
    };

    const item = await documentClient.get(queryParams).promise();
    const customerId = item.Item.customerId;

    const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
    });

    return {paymentMethods: paymentMethods.data};
});