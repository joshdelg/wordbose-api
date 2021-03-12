import wrapper from "./libs/lambda-lib";
import AWS from 'aws-sdk';
import moment from "moment";
import stripePkg from "stripe";

export const handler = wrapper(async(event, context) => {
  const documentClient = new AWS.DynamoDB.DocumentClient();
  const stripe = stripePkg(process.env.stripeSecret);

  // Email
  const data = JSON.parse(event.body);
  const email = data.email;
  const name = data.name;

  const customer = await stripe.customers.create({
    name: name,
    email: email
  });

  const params = {
    TableName: process.env.usersTableName,
    Item: {
      userId: event.requestContext.identity.cognitoIdentityId,
      name: name,
      email: email,
      paymentId: customer.id,
      emailNotifications: true,
      numTranscripts: 0,
      numPaidTranscripts: 0,
      secondsTranscribed: 0,
      signUpDate: moment().format(),
      active: true,
      longestTranscriptSeconds: 0
    }
  };

  await documentClient.put(params).promise();

  return params.Item;
});