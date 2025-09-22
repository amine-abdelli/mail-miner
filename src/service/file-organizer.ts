import { promises as fs } from 'fs'
import path from 'path'

export interface FileOrganizerOptions {
  sourceDir: string
  targetDir: string
  extensions: string[]
}

export class FileOrganizer {
  private options: FileOrganizerOptions

  constructor(options: FileOrganizerOptions) {
    this.options = options
  }

  async organize(): Promise<void> {
    const files = await this.getFilesToOrganize()
    
    for (const file of files) {
      await this.organizeFile(file)
    }
  }

  private async getFilesToOrganize(): Promise<string[]> {
    const files = await fs.readdir(this.options.sourceDir)
    
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return this.options.extensions.includes(ext)
    })
  }

  private async organizeFile(fileName: string): Promise<void> {
    const sourceFilePath = path.join(this.options.sourceDir, fileName)
    const fileExtension = path.extname(fileName).toLowerCase()
    const targetFolderPath = path.join(this.options.targetDir, fileExtension)
    const targetFilePath = path.join(targetFolderPath, fileName)

    // Create target folder if it doesn't exist
    await fs.mkdir(targetFolderPath, { recursive: true })

    // Move the file
    await fs.rename(sourceFilePath, targetFilePath)
    
    console.log(`Moved: ${fileName} -> ${targetFolderPath}/`)
  }

  async getStats(): Promise<{ totalFiles: number; byExtension: Record<string, number> }> {
    const files = await this.getFilesToOrganize()
    const stats = {
      totalFiles: files.length,
      byExtension: {} as Record<string, number>
    }

    for (const file of files) {
      const ext = path.extname(file).toLowerCase()
      stats.byExtension[ext] = (stats.byExtension[ext] || 0) + 1
    }

    return stats
  }
}