#!/usr/bin/env python3
"""
Main orchestrator for the email processing system.
Coordinates the entire workflow from file sorting to CSV export.
"""

import os
import sys
import logging
from pathlib import Path
from datetime import datetime

# Add current directory and subdirectories to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
sys.path.append(os.path.join(current_dir, 'pst-processor'))
sys.path.append(os.path.join(current_dir, 'msg-processor'))
sys.path.append(os.path.join(current_dir, 'contacts-extractor'))

# Import modules
from file_sorter import sort_files
from email_deduplicator import process_deduplication

# Import processor functions with different names to avoid conflicts
import importlib.util

# Load PST processor
pst_spec = importlib.util.spec_from_file_location("pst_processor", os.path.join(current_dir, 'pst-processor', 'processor.py'))
pst_module = importlib.util.module_from_spec(pst_spec)
pst_spec.loader.exec_module(pst_module)
process_all_pst_files = pst_module.process_all_pst_files

# Load MSG processor  
msg_spec = importlib.util.spec_from_file_location("msg_processor", os.path.join(current_dir, 'msg-processor', 'processor.py'))
msg_module = importlib.util.module_from_spec(msg_spec)
msg_spec.loader.exec_module(msg_module)
process_all_msg_files = msg_module.process_all_msg_files

# Load contact extractor
from contact_extractor import process_contact_extraction
from csv_converter import convert_contacts_to_csv, create_detailed_csv

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'email_processing_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def main():
    """
    Main orchestrator function that runs the complete email processing workflow
    """
    logger.info("="*60)
    logger.info("Starting Email Processing System")
    logger.info("="*60)
    
    # Step 1: File Sorting
    logger.info("Step 1: Sorting files from unsorted directory")
    try:
        sort_result = sort_files()
        if sort_result:
            logger.info(f"File sorting completed: {sort_result['msg_files']} MSG, {sort_result['pst_files']} PST files")
        else:
            logger.warning("File sorting returned no results")
    except Exception as e:
        logger.error(f"Error in file sorting: {str(e)}")
        return False
    
    # Step 2: Process PST files
    logger.info("Step 2: Processing PST files")
    try:
        pst_count = process_all_pst_files()
        logger.info(f"PST processing completed: {pst_count} emails extracted")
    except Exception as e:
        logger.error(f"Error in PST processing: {str(e)}")
        # Continue with MSG processing even if PST fails
    
    # Step 3: Process MSG files
    logger.info("Step 3: Processing MSG files")
    try:
        msg_count = process_all_msg_files()
        logger.info(f"MSG processing completed: {msg_count} emails extracted")
    except Exception as e:
        logger.error(f"Error in MSG processing: {str(e)}")
        # Continue with deduplication even if MSG fails
    
    # Step 4: Email Deduplication
    logger.info("Step 4: Deduplicating emails")
    try:
        dedup_count = process_deduplication()
        if dedup_count == 0:
            logger.error("No emails available for deduplication. Stopping workflow.")
            return False
        logger.info(f"Deduplication completed: {dedup_count} unique emails")
    except Exception as e:
        logger.error(f"Error in email deduplication: {str(e)}")
        return False
    
    # Step 5: Contact Extraction
    logger.info("Step 5: Extracting contact information using Ollama")
    try:
        extracted_count = process_contact_extraction()
        if extracted_count == 0:
            logger.error("No contacts were extracted. Stopping workflow.")
            return False
        logger.info(f"Contact extraction completed: {extracted_count} contacts extracted")
    except Exception as e:
        logger.error(f"Error in contact extraction: {str(e)}")
        return False
    
    # Step 6: CSV Conversion
    logger.info("Step 6: Converting contacts to CSV format")
    try:
        csv_count = convert_contacts_to_csv()
        detailed_csv_count = create_detailed_csv()
        logger.info(f"CSV conversion completed: {csv_count} contacts in standard CSV")
        logger.info(f"Detailed CSV created with {detailed_csv_count} contacts")
    except Exception as e:
        logger.error(f"Error in CSV conversion: {str(e)}")
        return False
    
    # Workflow Summary
    logger.info("="*60)
    logger.info("Email Processing Workflow Completed Successfully!")
    logger.info("="*60)
    logger.info("Summary:")
    logger.info(f"  - Files sorted: MSG and PST files organized")
    logger.info(f"  - Emails processed: PST and MSG files parsed")
    logger.info(f"  - Unique emails: {dedup_count} after deduplication")
    logger.info(f"  - Contacts extracted: {extracted_count} contacts")
    logger.info(f"  - CSV exports: Standard and detailed CSV files created")
    
    # Show output file locations
    contacts_dir = Path("src/contacts-extractor")
    csv_files = list(contacts_dir.glob("contacts_*.csv"))
    if csv_files:
        logger.info("Output files:")
        for csv_file in sorted(csv_files, key=lambda x: x.stat().st_mtime, reverse=True)[:2]:  # Show latest 2
            logger.info(f"  - {csv_file}")
    
    return True

def check_dependencies():
    """Check if required dependencies are available"""
    logger.info("Checking system dependencies...")
    
    # Check if Ollama is running
    try:
        import requests
        response = requests.get("http://localhost:11434/api/version", timeout=5)
        if response.ok:
            logger.info("✓ Ollama API is accessible")
        else:
            logger.warning("⚠ Ollama API returned error status")
    except Exception as e:
        logger.error("✗ Ollama API is not accessible. Make sure Ollama is running.")
        logger.error("  Install: https://ollama.ai/")
        logger.error("  Run: ollama serve")
        return False
    
    # Check Python packages
    required_packages = ['extract_msg', 'pypff', 'requests']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            logger.info(f"✓ {package} is installed")
        except ImportError:
            logger.error(f"✗ {package} is not installed")
            missing_packages.append(package)
    
    if missing_packages:
        logger.error("Missing packages. Install with:")
        for package in missing_packages:
            logger.error(f"  pip install {package}")
        return False
    
    return True

if __name__ == "__main__":
    print("Email Processing System - Main Orchestrator")
    print("=" * 60)
    
    # Check dependencies first
    if not check_dependencies():
        print("Please install missing dependencies before running the system.")
        sys.exit(1)
    
    # Run the main workflow
    success = main()
    
    if success:
        print("\n✅ Email processing completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Email processing failed. Check the logs for details.")
        sys.exit(1)