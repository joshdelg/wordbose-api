import AWS from "aws-sdk";
import createResponse from "./libs/response-lib";

export async function handler(event, context) {

  // Only execute code if trigger object is in root of bucket
  // This is where transcribe outputs by default
  if(event.Records[0].s3.object.key.indexOf('/') === -1) {

    const s3 = new AWS.S3();
    const documentClient = new AWS.DynamoDB.DocumentClient();

    const bucketName = event.Records[0].s3.bucket.name;
    const itemKey = event.Records[0].s3.object.key;

    // Item will have extension of .json
    const transcriptId = itemKey.substring(0, itemKey.length - '.json'.length);

    // Request data object from bucket
    const s3DataParams = {
      Bucket: bucketName,
      Key: `data/${transcriptId}.data`
    };

    const s3TranscriptParams = {
       Bucket: bucketName,
       Key: `${transcriptId}.json`
    };

    try {
      // Get data object from bucket
      const dataObject = await s3.getObject(s3DataParams).promise();
      const transcriptData = JSON.parse(dataObject.Body.toString());

      // Get transcript text from bucket
      const transcriptFile = await s3.getObject(s3TranscriptParams).promise();
      const transcriptText = JSON.parse(transcriptFile.Body.toString()).results.transcripts[0].transcript;
      // .results.items can be used to get data/alternatives for each word for editing in the future

      const dynamoParams = {
        TableName: process.env.tableName,
        Item: {
          userId: transcriptData.userId,
          transcriptId: transcriptId,
          transcriptName: transcriptData.transcriptName,
          fileName: transcriptData.fileName,
          fileLocation: transcriptData.fileLocation,
          date: transcriptData.date,
          transcript: transcriptText
        }
      };

      await documentClient.put(dynamoParams).promise();

      return createResponse(200, JSON.stringify(dynamoParams.Item));
    } catch (e) {
      return createResponse(500, JSON.stringify({status: false}));
    }

  }

}