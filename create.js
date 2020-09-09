import wrapper from "./libs/lambda-lib";
import AWS from 'aws-sdk';

export const handler = wrapper(async(event, context) => {
  const documentClient = new AWS.DynamoDB.DocumentClient();

  const data = JSON.parse(event.body);
  const extension = data.fileName.substring(data.fileName.lastIndexOf('.'));
  const fileLocation = `s3://${process.env.uploadsBucketName}/private/${event.requestContext.identity.cognitoIdentityId}/${data.transcriptId}${extension}`;

  const params = {
    TableName: process.env.tableName,
    Item: {
      userId: event.requestContext.identity.cognitoIdentityId,
      transcriptId: data.transcriptId,
      transcriptName: data.transcriptName,
      fileName: data.fileName,
      date: data.date,
      fileLocation: fileLocation,
      email: data.email,
      numSpeakers: data.numSpeakers,
      fileDuration: data.fileDuration,
      isPaid: data.isPaid
    }
  };

  await documentClient.put(params).promise();

  return params.Item;
});