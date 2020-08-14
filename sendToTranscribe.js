import AWS from "aws-sdk";
import createResponse from "./libs/response-lib";
import moment from "moment";

export async function handler(event, context) {

  // Triggered by S3 event
  const bucketName = event.Records[0].s3.bucket.name;

  // itemKey is encoded so ':' becomes %3A, this needs to be converted back to :
  const itemKey = event.Records[0].s3.object.key.replace('%3A', ':'); // In the form 'private/user-id/file-name'

  // Parsing file name
  // userId = us-west-2:27tuaqoncwlgnuam
  const userId = itemKey.substring(8, itemKey.lastIndexOf('/'));
  // userIdMod = 27tuaqoncwlgnuam because transcriptJobName can't have ':'
  const userIdMod = userId.substring(10);
  const transcriptId = itemKey.substring(itemKey.lastIndexOf('/') + 1, itemKey.lastIndexOf('.'));
  console.log('Transcript Id', transcriptId);

  const s3URI = `s3://${bucketName}/${itemKey}`;

  // Initialize AWS services
  const documentClient = new AWS.DynamoDB.DocumentClient();
  const transcribe = new AWS.TranscribeService();

  const dynamoParams = {
    TableName: process.env.tableName,
    Key: {
      userId: userId,
      transcriptId: transcriptId
    }
  };

  // Make DynamoDB request to get number of speakers
  try {
    const object = await documentClient.get(dynamoParams).promise();
    const numSpeakers = object.Item.numSpeakers;
    const fileDuration = object.Item.fileDuration;
    const isPaid = object.Item.isPaid;

    // Default to multiple speakers until setting added on frontend
    const transcribeJobParams = {
      LanguageCode: 'en-US',
      Media: {
        MediaFileUri: s3URI
      },
      TranscriptionJobName: `${userIdMod}_${transcriptId}`,
      OutputBucketName: process.env.destBucketName,
      Settings: (numSpeakers > 1) ? ({
        MaxSpeakerLabels: numSpeakers,
        ShowSpeakerLabels: true
      }) : {}
    };

    console.log(s3URI);

    // Send file to Transcribe
    await transcribe.startTranscriptionJob(transcribeJobParams).promise();

    // Update data in users database
    const dynamoUpdateParams = {
      TableName: process.env.usersTableName,
      Key: {
        userId: userId
      },
      UpdateExpression: `set numTranscripts = numTranscripts + :i, secondsTranscribed = secondsTranscribed + :s, lastTranscriptDate = :d${(isPaid) ? ', numPaidTranscripts = numPaidTranscripts + :i' : ''}`,
      ExpressionAttributeValues: {
        ':i': 1,
        ':s': fileDuration,
        ':d': moment().format()
      },
      ReturnValues: 'ALL_NEW'
    };

    const secondUpdateParams = {
      TableName: process.env.usersTableName,
      Key: {
        userId: userId
      },
      UpdateExpression: 'set longestTranscriptSeconds = :d',
      ConditionExpression: ':d > longestTranscriptSeconds',
      ExpressionAttributeValues: {
        ':d': fileDuration
      }
    };

    await documentClient.update(dynamoUpdateParams).promise();
    await documentClient.update(secondUpdateParams).promise();

    return createResponse(200, JSON.stringify({status: true}));
  } catch (err) {
    console.log(err);
    return createResponse(500, JSON.stringify({status: false}));
  }
}