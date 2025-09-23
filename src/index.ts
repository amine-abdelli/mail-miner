import { FileOrganizer } from "./service/file-organizer";
import { parseAndLoadMsgFiles } from "./service/msg/msg.service";
import logger from "./service/logger/logger.service";

export async function main() {
  logger.info("Starting Mail Miner application");

  const organizer = new FileOrganizer({
    sourceDir: "src/input/raw",
    targetDir: "src/input",
    extensions: [".pst", ".msg"],
  });

  try {
    // Show current stats
    const stats = await organizer.getStats();
    logger.info("File organization stats", stats);
    console.log("Files to organize:");
    console.log(`Total files: ${stats.totalFiles}`);
    console.log("By extension:", stats.byExtension);
    console.log("");

    if (stats.totalFiles === 0) {
      console.warn("No .pst or .msg files found to organize.");
    }

    // Organize files
    console.log("Starting file organization...");
    await organizer.organize();
    console.log("File organization completed!");
    logger.info("Logging and parsing .msg files...");
    await parseAndLoadMsgFiles();
    logger.info("Application finished successfully");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("Application error", { error: errorMsg });
    console.error("Error:", errorMsg);
  }
}

// Run the main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
