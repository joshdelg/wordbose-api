import wrapper from "./libs/lambda-lib";
import AWS from "aws-sdk";

export const handler = wrapper(async(event, context) => {
  const blockify = (newBlocks, transcriptObject, numSpeakers) => {
    const items = transcriptObject.results.items;
  
    if(numSpeakers > 1) {
      // Split transcript into blocks
      let blocks = [];
  
      let i = 0;
      const segments = transcriptObject.results.speaker_labels.segments;
      segments.forEach((seg) => {
        let speakerId = parseInt(seg.speaker_label.split('_')[1]);
        let speakerName = "Speaker " + speakerId;
        let startTime = seg.start_time;
        let endTime = seg.end_time;
        let text = "";
  
        const segmentItems = seg.items;
        segmentItems.forEach((word, index) => {
          let item = items[i];
          text += item.alternatives[0].content;
          if(items[i + 1] && (item.type == "pronunciation" && items[i + 1].type == "punctuation")) {
            text += items[i + 1].alternatives[0].content + " ";
            i++;
          } else {
            text += " ";
          }
          i++;
        });
        text = text.substring(0, text.length - 1);
        blocks.push({speakerId, speakerName, startTime, endTime, text});
      });
  
      let ind = 0;
      while(ind < blocks.length) {
        let currBlock = blocks[ind];
        let newText = "";
        while(blocks[ind] && blocks[ind].speakerId == currBlock.speakerId) {
          newText += blocks[ind].text + " ";
          ind++;
        }
        newText = newText.substring(0, newText.length - 1);
        newBlocks.push({...currBlock, startTime: currBlock.startTime, endTime: blocks[ind - 1].endTime, text: newText});
      }
    } else {
      newBlocks.push({
        speakerId: 0,
        speakerName: "Speaker 0",
        startTime: items[0].start_time,
        endTime: items[items.length - 2].end_time,
        text: transcriptObject.results.transcripts[0].transcript
      });
    }
    console.log(newBlocks);
  };

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

    // Get transcript output file from bucket
    const transcriptFile = await s3.getObject(s3TranscriptParams).promise();
    // Get transcript text from output file
    const transcriptObject = JSON.parse(transcriptFile.Body.toString());
    const transcriptText = transcriptObject.results.transcripts[0].transcript;
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

    // Blockify the transcript text
    let newBlocks = [];
    blockify(newBlocks, transcriptObject, transcriptItem.numSpeakers);

    let formattedTranscriptText = "";
    let rawTranscriptText = "";
    newBlocks.forEach((block) => {
      formattedTranscriptText += `<h4>${block.speakerName}</h4><p>${block.text}</p><br/>`;
      rawTranscriptText += `${block.speakerName}: ${block.text}\n`;
    });

    // Send email to alert of transcript finish
    const emailParams = {
      Destination: {
        ToAddresses: [transcriptItem.email]
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `
                <div>
                  <div style="padding: 16px 0;">
                    <h1>Wordbose | AI-Powered Audio Transcription</h1>
                  </div>
                  <div>
                    <h2>Here's your transcript!</h2>
                    <h3><a href="http://app.wordbose.com/${transcriptItem.transcriptId}">Click here</a> to view your transcript in the Wordbose Web App to make changes</h3>
                    ${formattedTranscriptText}
                  </div>
                </div>
            `
          },
          Text: {
            Charset: "UTF-8",
            Data: rawTranscriptText
          }
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Your transcript is complete!"
        }
      },
      Source: "Wordbose Notifications <notifications@wordbose.com>"
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
      UpdateExpression: 'set transcript = :t, blocks = :b',
      ExpressionAttributeValues: {
        ':t': transcriptText,
        ':b': newBlocks
      },
      ReturnValues: 'ALL_NEW'
    };

    const updated = await documentClient.update(dynamoParams).promise();

    // Delete transcribe output file from S3
    const s3DeleteParams = {
      Bucket: bucketName,
      Key: itemKey
    };

    await s3.deleteObject(s3DeleteParams).promise();
    return updated.Attributes;
  }
});