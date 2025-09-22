import { promises as fs } from 'fs'
import path from 'path'
import type { ParsedMsgFile } from './msg.utils'
import { parseFile, formatParsedData } from './msg.utils.js'
import { logger } from '../logger/logger.service.js'

export interface MsgServiceOptions {
  inputDir: string
  outputDir?: string
  extractAttachments?: boolean
}

export class MsgService {
  private options: MsgServiceOptions

  constructor(options: MsgServiceOptions) {
    this.options = {
      extractAttachments: false,
      ...options
    }
  }

  async processAllMsgFiles(): Promise<ParsedMsgFile[]> {
    logger.info('Starting MSG file processing', { inputDir: this.options.inputDir })
    
    try {
      const msgFiles = await this.findMsgFiles()
      logger.info(`Found ${msgFiles.length} MSG files to process`)
      
      const results: ParsedMsgFile[] = []
      
      for (const filePath of msgFiles) {
        const parsed = await this.processSingleFile(filePath)
        if (parsed) {
          results.push(parsed)
        }
      }
      
      logger.info(`Successfully processed ${results.length} out of ${msgFiles.length} MSG files`)
      return results
    } catch (error) {
      logger.error('Failed to process MSG files', {
        inputDir: this.options.inputDir,
        error: error instanceof Error ? error.message : String(error)
      })
      return []
    }
  }

  async processSingleFile(filePath: string): Promise<ParsedMsgFile | null> {
    logger.info('Processing MSG file', { filePath })
    
    try {
      const parsed = await parseFile(filePath)
      
      if (!parsed) {
        logger.warn('Failed to parse MSG file', { filePath })
        return null
      }

      // Log the parsed data
      logger.info('MSG file parsed successfully', {
        fileName: parsed.fileName,
        subject: parsed.subject,
        from: parsed.from,
        bodyLength: parsed.body?.length || 0,
      })

      return parsed
    } catch (error) {
      logger.error('Error processing MSG file', {
        filePath,
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  private async findMsgFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.options.inputDir)
      const msgFiles = files
        .filter(file => path.extname(file).toLowerCase() === '.msg')
        .map(file => path.join(this.options.inputDir, file))
      
      logger.info('Found MSG files', { count: msgFiles.length, directory: this.options.inputDir })
      return msgFiles
    } catch (error) {
      logger.error('Failed to find MSG files', {
        inputDir: this.options.inputDir,
        error: error instanceof Error ? error.message : String(error)
      })
      return []
    }
  }

  async generateReport(parsedFiles: ParsedMsgFile[]): Promise<string> {
    const report = [
      `MSG Files Processing Report`,
      `Generated: ${new Date().toISOString()}`,
      `Total Files: ${parsedFiles.length}`,
      ``,
      `Summary:`,
      `- Files with subjects: ${parsedFiles.filter(f => f.subject).length}`,
      ``,
      `Files:`,
      ...parsedFiles.map(file => formatParsedData(file))
    ].join('\n')

    if (this.options.outputDir) {
      await fs.mkdir(this.options.outputDir, { recursive: true })
      const reportPath = path.join(this.options.outputDir, `msg-report-${Date.now()}.txt`)
      await fs.writeFile(reportPath, report)
      logger.info('Report generated', { reportPath })
    }

    return report
  }
}