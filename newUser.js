import wrapper from "./libs/lambda-lib";
import AWS from 'aws-sdk';
import moment from "moment";

export const handler = wrapper(async(event, context) => {
  const documentClient = new AWS.DynamoDB.DocumentClient();

  // Email
  const data = JSON.parse(event.body);
  const email = data.email;
  const name = data.name;

  const params = {
    TableName: process.env.usersTableName,
    Item: {
      userId: event.requestContext.identity.cognitoIdentityId,
      name: name,
      email: email,
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