import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import createResponse from './libs/response-lib';

export async function handler(event, context) {
  // Create route just for testing purposes
  const documentClient = new AWS.DynamoDB.DocumentClient();

  const data = JSON.parse(event.body);

  const params = {
    TableName: process.env.tableName,
    Item: {
      userId: event.requestContext.identity.cognitoIdentityId,
      transcriptId: uuidv4(),
      transcriptName: data.transcriptName,
      transcript: data.transcript
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