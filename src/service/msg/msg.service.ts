import { promises as fs } from 'fs';
import { join } from 'path';
// Import MsgReader with createRequire for ES modules
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const MsgReader = require('@kenjiuno/msgreader');
import { emailToSkip, sanitizeMailContent } from './msg.utils';
import { askOllamaMistral } from '../ollama/ollama.service';
import logger from '../logger/logger.service';
import { RawMsgFileData, EmailData } from './msg.type';
import _ from 'lodash';

async function getFileDataFromMsg(fileName: string): Promise<RawMsgFileData> {

  const filePath = join(process.cwd(), 'src', 'input', '.msg', `${fileName}`);

  const fileBuffer = await fs.readFile(filePath);

  // Parse the .msg file
  const msgReader = new MsgReader.default(fileBuffer);
  const fileData: RawMsgFileData = msgReader.getFileData();

  return fileData;
}

async function parseAndLoadMsgFiles() {
  const msgDir = join(process.cwd(), 'src', 'input', '.msg');
  const finalResponses: any[] = [];
  const rawBodiesForComparison: any[] = [];
  try {
    // Read all files in the .msg directory
    const files = await fs.readdir(msgDir);
    const msgFiles = files.filter(file => file.toLowerCase().endsWith('.msg'));

    if (msgFiles.length === 0) {
      logger.info('No .msg files found in directory', { directory: msgDir });
      return;
    }

    logger.info(`Found ${msgFiles.length} .msg files to parse`);
    let index = 0;


    const msgMap: Map<string, RawMsgFileData & { fileName: string } | null> = new Map();
    // Group .msg file per senderEmail to avoid duplicate processing
    for (const fileName of msgFiles) {

      const fileData = await getFileDataFromMsg(fileName);
      const fileDataWithFilename = { ...fileData, fileName };
      if (!msgMap.has(fileDataWithFilename.senderEmail.trim())) {
        rawBodiesForComparison.push(fileDataWithFilename);
        msgMap.set(fileDataWithFilename.senderEmail.trim(), fileDataWithFilename);
      }
    }
    for (const [_, _fileData] of msgMap) {
      try {
        // html, 
        const fileData = await getFileDataFromMsg(_fileData?.fileName || '');
        const sanitizedMsg = { ...fileData, body: sanitizeMailContent(fileData.body) || '' };

        if (sanitizedMsg.body) {
          logger.info('Processing new email', { senderEmail: fileData?.senderEmail || 'Unknown email' });
          // logger.info(`Processing email from: ${fileData?.senderEmail || 'Unknown email'}`);
          const ollamaPromptBody = JSON.stringify({
            messageId: fileData?.messageId || 'Unknown id',
            senderName: fileData?.senderName || 'Unknown sender',
            senderEmail: fileData?.senderEmail.toLocaleLowerCase() || 'Unknown email',
            body: sanitizedMsg.body || 'No body content',
          })

          let response = await askOllamaMistral(ollamaPromptBody);
          console.log('response', response)

          if (!response) {
            response = await askOllamaMistral(ollamaPromptBody);
            if (!response) {
              console.warn('Ollama did not return a valid response after two attempts, skipping this email.', { senderEmail: fileData?.senderEmail || 'Unknown email' });
              continue;
            }
          }

          finalResponses.push(response);
        }
        // HERE WRITE A JSON FILE WITH THE RESPONSES
      } catch (error) {
        logger.error(`Failed to parse .msg file`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }

      index++;
      logger.info(`Progress: ${index}/${msgFiles.length} files processed`);
    }

    // logger.info('MSG file parsing completed');

    // logger.info('Parsed contacts', msgMap);

    // Write all responses to JSON file
    const finalOutputPath = join(process.cwd(), 'finalResponses.json');
    const rawBodiesForComparisonPath = join(process.cwd(), 'rawBodiesForComparison.json');

    await fs.writeFile(finalOutputPath, JSON.stringify(finalResponses, null, 2), 'utf8');
    await fs.writeFile(rawBodiesForComparisonPath, JSON.stringify(rawBodiesForComparison, null, 2), 'utf8');

    logger.info(`All responses written to: ${finalOutputPath}`);
  } catch (error) {
    logger.error('Failed to read .msg directory', {
      directory: msgDir,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

export { parseAndLoadMsgFiles };


// {
//   "first_name": "string or null",
//   "last_name": "string or null",
//   "company_name": "string or null",
//   "address": "street address or null",
//   "city": "string or null",
//   "post_code": "string or null",
//   "landline": "string or null",
//   "mobile": "string or null",
//   "email": "string or null",
//   "role": "job title or null"
// }

// {
//   "body": "Bonjour, Je serai de retour au bureau le 8 janvier 2024. En cas d'urgence, vous pouvez joindre le standard d'ALL IN SPACE au 03.20.04.04.51. A bientôt Elodie HUET",
//   "level": "info",
//   "message": "DIANTRE",
//   "messageId": "<84db9c2d3ffb4b3cb4fdca83178dc756@DAG15EX2.local>",
//   "senderEmail": "ehuet@all-in-space.com",
//   "senderName": "Elodie HUET",
//   "service": "mail-miner",
//   "timestamp": "2025-09-21 13:06:12"
// }