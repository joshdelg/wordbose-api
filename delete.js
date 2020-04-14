import AWS from "aws-sdk";
import createResponse from "./libs/response-lib";

export async function handler(event, context) {

  const documentClient = new AWS.DynamoDB.DocumentClient();

  const params = {
    TableName: process.env.tableName,
    Key: {
      userId: event.requestContext.identity.cognitoIdentityId,
      transcriptId: event.pathParameters.id
    },
    ReturnValues: 'ALL_OLD'
  };

  try {
    const deleted = await documentClient.delete(params).promise();
    return createResponse(200, JSON.stringify(deleted.Attributes));
  } catch (e) {
    console.log(e);
    return createResponse(500, JSON.stringify({ status: false }));
  }

}