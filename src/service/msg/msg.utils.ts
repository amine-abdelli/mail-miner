import { logger } from '../logger/logger.service';
import * as MsgReader from '@kenjiuno/msgreader';
import path from 'path';
import { promises as fs } from 'fs';

export interface ParsedMsgFile {
  fileName: string
  filePath: string
  subject?: string
  from?: string
  date?: Date
  body?: string
}

export async function parseFile(filePath: string): Promise<ParsedMsgFile | null> {
    try {
      logger.info('Starting to parse MSG file', { filePath })
      
      const buffer = await fs.readFile(filePath)
      const arrayBuffer = new ArrayBuffer(buffer.length)
      const view = new Uint8Array(arrayBuffer)
      view.set(buffer)
      const msgReader = new MsgReader.default(arrayBuffer)
      const fileInfo = msgReader.getFileData()

      const parsed: ParsedMsgFile = {
        fileName: path.basename(filePath),
        filePath,
        subject: fileInfo.subject || undefined,
        from: fileInfo.senderName || fileInfo.senderEmail || undefined,
        date: fileInfo.creationTime ? new Date(fileInfo.creationTime) : undefined,
        body: fileInfo.body || undefined,
      }

      logger.info('Successfully parsed MSG file', {
        fileName: parsed.fileName,
        subject: parsed.subject,
        from: parsed.from,
      })

      return parsed
    } catch (error) {
      logger.error('Failed to parse MSG file', {
        filePath,
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
}

export function formatParsedData(parsed: ParsedMsgFile): string {
    return [
      `File: ${parsed.fileName}`,
      `Subject: ${parsed.subject || 'N/A'}`,
      `From: ${parsed.from || 'N/A'}`,
      `Date: ${parsed.date?.toISOString() || 'N/A'}`,
      `Body Length: ${parsed.body?.length || 0} chars`,
      '---'
    ].join('\n')
}