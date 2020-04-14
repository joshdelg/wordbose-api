import AWS from 'aws-sdk';
import createResponse from './libs/response-lib';

export async function handler(event, context) {

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

  try {
    // Capture response from query
    const data = await documentClient.query(params).promise();
    // Get items from the query response and return it as JSON data
    const items = data.Items;
    return createResponse(200, JSON.stringify(items));
  } catch (e) {
    // If there is an error return 500 status
    return createResponse(500, JSON.stringify({status: false}));
  }

}