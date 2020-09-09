import wrapper from "./libs/lambda-lib";
import AWS from "aws-sdk";

export const handler = wrapper(async(event, context) => {
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

  // Attempt to get item from database
  const item = await documentClient.get(params).promise();

  return item;
});