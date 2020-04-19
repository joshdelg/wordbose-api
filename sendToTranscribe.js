import AWS from "aws-sdk";
import createResponse from "./libs/response-lib";

export async function handler(event, context) {

  const destBucket = 'wordbose-destination-test';

  // Triggered by S3 event
  const bucketName = event.Records[0].s3.bucket.name;
  const itemKey = event.Records[0].s3.object.key; // In the form 'private/file-name'
  const fileName = itemKey.substring(8);

  const transcribe = new AWS.TranscribeService();

  const params = {
    LanguageCode: 'en-US',
    Media: {
      MediaFileUri: `s3://${bucketName}/${itemKey}`
    },
    TranscriptionJobName: `${fileName}-transcript`,
    OutputBucketName: destBucket
  };

  try {
    await transcribe.startTranscriptionJob(params).promise();
    console.log('Transcribe job started with job name', params.TranscriptionJobName);
    return createResponse(200, JSON.stringify({status: true}));
  } catch (e) {
    console.log(e);
    return createResponse(500, JSON.stringify({status: false}));
  }

}