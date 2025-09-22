import { FileOrganizer } from "./service/file-organizer.js";
import { MsgService } from "./service/msg/msg.service.js";
import { logger } from "./service/logger/logger.service.js";

export async function main() {
	logger.info("Starting Mail Miner application");

	const organizer = new FileOrganizer({
		sourceDir: "src/inputs/raw",
		targetDir: "src/inputs",
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
		console.log("prout", stats.byExtension);
		// Process MSG files if any exist
		logger.info("Starting MSG file processing");

		const msgService = new MsgService({
			inputDir: "src/inputs/.msg",
			outputDir: "src/outputs",
			extractAttachments: true,
		});

		const parsedFiles = await msgService.processAllMsgFiles();
		console.log("MSG file processing completed!", parsedFiles);
		if (parsedFiles.length > 0) {
			const report = await msgService.generateReport(parsedFiles);
			console.log(
				`\nProcessed ${parsedFiles.length} MSG files. Check logs for details.`,
			);
			logger.info("MSG processing completed", {
				processedCount: parsedFiles.length,
			});
		} else {
			console.log("No MSG files were successfully processed.");
			logger.warn("No MSG files were successfully processed");
		}
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
