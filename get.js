import AWS from "aws-sdk";
import createResponse from "./libs/response-lib";

export async function handler(event, context) {

  // Initialize client for interfacing with DynamoDB
  const documentClient = new AWS.DynamoDB.DocumentClient();

  // Use tableName defined in serverless.yml, get document by its key
  // from event parameters
  var params = {
    TableName: process.env.tableName,
    Key: {
      userId: event.requestContext.identity.cognitoIdentityId,
      transcriptId: event.pathParameters.id,
    },
  };

  try {
    // Attempt to get item from database
    const item = await documentClient.get(params).promise();
    return createResponse(200, JSON.stringify(item));
  } catch (e) {
    // If there is an error return 500 response
    return createResponse(500, JSON.stringify({ status: false }));
  }
}
