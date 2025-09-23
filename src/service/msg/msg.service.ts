import { promises as fs } from 'fs';
import { join } from 'path';
// Import MsgReader with createRequire for ES modules
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const MsgReader = require('@kenjiuno/msgreader');
import { emailToSkip, sanitizeMailContent } from './msg.utils';
import { askOllamaMistral } from '../ollama/ollama.service';
import logger from '../logger/logger.service';
import { FileData, ExtractedContactInfo } from './msg.type';


const msgMap: Map<string, ExtractedContactInfo> = new Map();
const responses: any[] = [];

async function parseAndLoadMsgFiles() {
  const msgDir = join(process.cwd(), 'src', 'input', '.msg');

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

    // Group .msg file per senderEmail to avoid duplicate processing

    for (const fileName of msgFiles) {
      const filePath = join(msgDir, fileName);

      try {
        // logger.info(`Parsing file: ${fileName}`);
        console.log('='.repeat(60));
        console.log('index', index)
        // Read the file as buffer
        const fileBuffer = await fs.readFile(filePath);

        // Parse the .msg file
        const msgReader = new MsgReader.default(fileBuffer);
        const fileData: FileData = msgReader.getFileData();
        const sanitizedMsg = { ...fileData, body: sanitizeMailContent(fileData.body) || '' };
        // !emailToSkip(sanitizedMsg.body, fileData.senderEmail) && 
        if (!msgMap.get(fileData.senderEmail) && sanitizedMsg.body) {
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

          logger.info("RAW_DATA_FROM_MSG", {
            senderEmail: fileData?.senderEmail || 'Unknown email',
            body: sanitizedMsg.body || 'No body content',
            senderName: fileData?.senderName || 'Unknown sender',
          });
          logger.info("OLLAMA_RESPONSE", response);
          responses.push(response);
          msgMap.set(fileData.senderEmail, response);
        }
        index++;
        console.log('='.repeat(60));
      } catch (error) {
        logger.error(`Failed to parse .msg file`, {
          fileName,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // logger.info('MSG file parsing completed');

    // logger.info('Parsed contacts', msgMap);

    // Write all responses to JSON file
    const outputPath = join(process.cwd(), 'responses.json');
    await fs.writeFile(outputPath, JSON.stringify(responses, null, 2), 'utf8');
    logger.info(`All responses written to: ${outputPath}`);

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