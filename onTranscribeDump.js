import AWS from "aws-sdk";
import createResponse from "./libs/response-lib";

export async function handler(event, context) {

  // Only execute code if trigger object is in root of bucket
  // This is where transcribe outputs by default
  if(event.Records[0].s3.object.key.indexOf('/') === -1) {

    // Initialize AWS services
    const s3 = new AWS.S3();
    const ses = new AWS.SES();
    const documentClient = new AWS.DynamoDB.DocumentClient();

    // Get transcript file location from S3 trigger event
    const bucketName = event.Records[0].s3.bucket.name;
    const itemKey = event.Records[0].s3.object.key;

    // Parse itemKey; will be in format {userId}_{transcriptId}.json
    const userIdMod = itemKey.substring(0, itemKey.indexOf('_'));
    const userId = 'us-west-2:' + userIdMod;
    const transcriptId = itemKey.substring(itemKey.indexOf('_') + 1, itemKey.length - '.json'.length);

    const s3TranscriptParams = {
       Bucket: bucketName,
       Key: `${userIdMod}_${transcriptId}.json`
    };

    try {
      // Get transcript output file from bucket
      const transcriptFile = await s3.getObject(s3TranscriptParams).promise();
      // Get transcript text from output file
      const transcriptText = JSON.parse(transcriptFile.Body.toString()).results.transcripts[0].transcript;
      // .results.items can be used to get data/alternatives for each word with timestamps for editing in the future

      // Get email and other data from dynamoDB
      const dynamoGetParams = {
        TableName: process.env.tableName,
        Key: {
          userId: userId,
          transcriptId: transcriptId
        }
      };

      const object = await documentClient.get(dynamoGetParams).promise();
      const transcriptItem = object.Item;
      console.log("transcript item", transcriptItem);

      // Send test email to alert of transcript finish
      const emailParams = {
        Destination: {
          ToAddresses: [transcriptItem.email]
        },
        Message: {
          Body: {
            Text: {
              Charset: "UTF-8",
              Data: transcriptText
            }
          },
          Subject: {
            Charset: "UTF-8",
            Data: "Your transcript is complete!"
          }
        },
        Source: "oscar@wordbose.com"
      };

      const sentEmail = await ses.sendEmail(emailParams).promise();
      console.log("sent email", sentEmail);

      // Update existing DynamoDB object with the transcript text
      const dynamoParams = {
        TableName: process.env.tableName,
        Key: {
          userId: userId,
          transcriptId: transcriptId
        },
        UpdateExpression: 'set transcript = :t',
        ExpressionAttributeValues: {
          ':t': transcriptText
        },
        ReturnValues: 'ALL_NEW'
      };


      const updated = await documentClient.update(dynamoParams).promise();

      return createResponse(200, JSON.stringify(updated.Attributes));
    } catch (e) {
      console.log(e);
      return createResponse(500, JSON.stringify({status: false}));
    }
  }
}