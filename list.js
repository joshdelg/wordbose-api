import wrapper from "./libs/lambda-lib";
import AWS from 'aws-sdk';

export const handler = wrapper(async(event, context) => {
  // Initialize document client to use native js types
  const documentClient = new AWS.DynamoDB.DocumentClient();

  const userSub = event.requestContext.identity.cognitoIdentityId;

  // Parameters for query
  var params = {
    TableName: process.env.tableName,
    KeyConditionExpression: 'userId = :uid', // return elements for which the userId = :uid
    ExpressionAttributeValues: {
      ':uid': userSub // :uid in the above expression represents our userSub
    }
  };

  // Capture response from query
  const data = await documentClient.query(params).promise();
  // Get items from the query response and return it as JSON data
  const items = data.Items;

  return items;
});