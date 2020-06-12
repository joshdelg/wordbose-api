import AWS from 'aws-sdk';
import createResponse from './libs/response-lib';

export async function handler(event, context) {
  const documentClient = new AWS.DynamoDB.DocumentClient();

  const data = JSON.parse(event.body);
  const extension = data.fileName.substring(data.fileName.lastIndexOf('.'));
  const fileLocation = `s3://${process.env.uploadsBucketName}/private/${event.requestContext.identity.cognitoIdentityId}/${data.transcriptId}.${extension}`;

  const params = {
    TableName: process.env.tableName,
    Item: {
      userId: event.requestContext.identity.cognitoIdentityId,
      transcriptId: data.transcriptId,
      transcriptName: data.transcriptName,
      fileName: data.fileName,
      date: data.date,
      fileLocation: fileLocation
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