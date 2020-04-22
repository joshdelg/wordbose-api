import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import createResponse from "./libs/response-lib";

export async function handler(event, context) {

  // Triggered by S3 event
  const bucketName = event.Records[0].s3.bucket.name;
  const itemKey = event.Records[0].s3.object.key; // In the form 'private/user-id/file-name'

  // Parsing file name
  const userId = itemKey.substring(8, itemKey.lastIndexOf('/'));
  const fileName = itemKey.substring(itemKey.lastIndexOf('/') + 1);
  const transcriptId = uuidv4();

  const transcribe = new AWS.TranscribeService();
  const s3 = new AWS.S3();

  const transcribeJobParams = {
    LanguageCode: 'en-US',
    Media: {
      MediaFileUri: `s3://${bucketName}/${itemKey}`
    },
    TranscriptionJobName: transcriptId,
    OutputBucketName: process.env.destBucketName
  };

  const transcriptData = {
    userId: userId,
    transcriptId: transcriptId,
    transcriptName: fileName.substring(0, fileName.lastIndexOf('.')),
    fileName: fileName,
    fileLocation: transcribeJobParams.Media.MediaFileUri,
    date: moment()
  };

  const s3UploadParams = {
    Body: Buffer.from(JSON.stringify(transcriptData)),
    Bucket: process.env.destBucketName,
    Key: `data/${transcriptId}.json`
  };

  try {
    // Send file to Transcribe
    await transcribe.startTranscriptionJob(transcribeJobParams).promise();

    // Upload data file to S3
    await s3.putObject(s3UploadParams).promise();

    return createResponse(200, JSON.stringify({status: true}));
  } catch (e) {
    return createResponse(500, JSON.stringify({status: false}));
  }

}