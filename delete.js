import wrapper from "./libs/lambda-lib";
import AWS from "aws-sdk";

export const handler = wrapper(async(event, context) => {
  const s3 = new AWS.S3();
  const documentClient = new AWS.DynamoDB.DocumentClient();

  const getParams = {
    TableName: process.env.tableName,
    Key: {
      userId: event.requestContext.identity.cognitoIdentityId,
      transcriptId: event.pathParameters.id
    }
  };

  const params = {
    TableName: process.env.tableName,
    Key: {
      userId: event.requestContext.identity.cognitoIdentityId,
      transcriptId: event.pathParameters.id
    },
    ReturnValues: 'ALL_OLD'
  };

   // Get file location from dynamoDB object
   const obj = await documentClient.get(getParams).promise();
   //Format: s3://${bucket}/${key}
   const fileLocation = obj.Item.fileLocation;

   // Delete media file from upload bucket
   const bucket = process.env.uploadsBucketName;
   const itemKey = fileLocation.substring(6 + bucket.length);

   await s3.deleteObject({Bucket: bucket, Key: itemKey}).promise();

   // Delete object from dynamoDB
   const deleted = await documentClient.delete(params).promise();

   return deleted.Attributes;
});