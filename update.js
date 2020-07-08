import AWS from 'aws-sdk';
import createResponse from './libs/response-lib';

export async function handler(event, context) {
  // Initialize document client
  const documentClient = new AWS.DynamoDB.DocumentClient();

  // Request body is passed as a string
  const data = JSON.parse(event.body);

  // Select transcript to be updated by primary and sort keys
  // Update values specified in update expression
  // Define attributes in expression attribute values
  // Return all attributes of the newly updated object
  const params = {
    TableName: process.env.tableName,
    Key: {
      userId: event.requestContext.identity.cognitoIdentityId,
      transcriptId: event.pathParameters.id
    },
    UpdateExpression: 'set transcriptName = :n, transcript = :t, blocks = :b',
    ExpressionAttributeValues: {
      ':n': data.transcriptName,
      ':t': data.transcript,
      ':b': data.blocks
    },
    ReturnValues: 'ALL_NEW'
  };

  try {
    const updated = await documentClient.update(params).promise();
    return createResponse(200, JSON.stringify(updated.Attributes));
  } catch (e) {
    console.log(e);
    return createResponse(500, JSON.stringify({status: false}));
  }

}