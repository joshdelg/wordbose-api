import wrapper from "./libs/lambda-lib";
import AWS from 'aws-sdk';

export const handler = wrapper(async(event, context) => {
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

  const updated = await documentClient.update(params).promise();
  
  return updated.Attributes;
});