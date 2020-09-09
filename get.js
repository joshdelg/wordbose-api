import wrapper from "./libs/lambda-lib";
import AWS from "aws-sdk";

export const handler = wrapper(async(event, context) => {
  // Initialize client for interfacing with DynamoDB
  const documentClient = new AWS.DynamoDB.DocumentClient();

  // Use tableName defined in serverless.yml, get document by its key
  // from event parameters
  // ! Error to test error catching
  var params = {
    //TableName: process.env.tableName,
    TableName: "hello, world",
    Key: {
      userId: event.requestContext.identity.cognitoIdentityId,
      transcriptId: event.pathParameters.id,
    },
  };

  // Attempt to get item from database
  const item = await documentClient.get(params).promise();

  return item;
});