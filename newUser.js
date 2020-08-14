import AWS from 'aws-sdk';
import createResponse from './libs/response-lib';
import moment from "moment";

export async function handler(event, context) {
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

  try {
    await documentClient.put(params).promise();
    return createResponse(200, JSON.stringify(params.Item));
  } catch (e) {
    console.log(e);
    return createResponse(500, JSON.stringify({status: false}));
  }
}