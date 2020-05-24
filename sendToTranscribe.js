import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import createResponse from "./libs/response-lib";

export async function handler(event, context) {

  // Triggered by S3 event
  const bucketName = event.Records[0].s3.bucket.name;

  // itemKey is encoded so ':' becomes %3A, this needs to be converted back to :
  const itemKey = event.Records[0].s3.object.key.replace('%3A', ':'); // In the form 'private/user-id/file-name'

  // Parsing file name
  // userId = us-west-2:27tuaqoncwlgnuam;/jva8nw
  const userId = itemKey.substring(8, itemKey.lastIndexOf('/'));
  // userIdMod = 27tuaqoncwlgnuam;/jva8nw because transcriptJobName can't have ':'
  const userIdMod = userId.substring(10);
  const fileName = itemKey.substring(itemKey.lastIndexOf('/') + 1);
  const transcriptId = uuidv4();

  const s3URI = `s3://${bucketName}/${itemKey}`;

  // Initialize AWS services
  const transcribe = new AWS.TranscribeService();
  const documentClient = new AWS.DynamoDB.DocumentClient();

  const transcribeJobParams = {
    LanguageCode: 'en-US',
    Media: {
      MediaFileUri: s3URI
    },
    TranscriptionJobName: `${userIdMod}_${transcriptId}`,
    OutputBucketName: process.env.destBucketName
  };

  const dynamoParams = {
    TableName: process.env.tableName,
    Item: {
      userId: userId,
      transcriptId: transcriptId,
      transcriptName: fileName.substring(0, fileName.lastIndexOf('.')),
      fileName: fileName,
      fileLocation: transcribeJobParams.Media.MediaFileUri,
      date: moment().format()
    }
  };

  try {
    console.log(s3URI);
    // Send file to Transcribe
    await transcribe.startTranscriptionJob(transcribeJobParams).promise();

    // Upload existing data to DynamoDB
    await documentClient.put(dynamoParams).promise();

    return createResponse(200, JSON.stringify(dynamoParams.Item));
  } catch (e) {
    console.log(e);
    return createResponse(500, JSON.stringify({status: false}));
  }
}