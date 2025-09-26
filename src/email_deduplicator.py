import os
import json
import logging
from pathlib import Path
from collections import defaultdict
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def load_json_files(directory):
    """Load all JSON files from a directory and return combined email list"""
    emails = []
    json_files = list(Path(directory).glob("*.json"))
    
    for json_file in json_files:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    emails.extend(data)
                    logger.info(f"Loaded {len(data)} emails from {json_file.name}")
                else:
                    logger.warning(f"JSON file {json_file.name} does not contain a list")
        except Exception as e:
            logger.error(f"Error loading {json_file}: {str(e)}")
    
    return emails

def deduplicate_emails(emails):
    """
    Deduplicate emails by sender email address.
    Keep only the first email from each sender.
    """
    logger.info(f"Starting deduplication of {len(emails)} emails")
    
    # Group emails by sender email
    email_groups = defaultdict(list)
    
    for email in emails:
        sender_email = email.get('senderEmail', '').strip().lower()
        if sender_email:  # Only process emails with valid sender email
            email_groups[sender_email].append(email)
        else:
            logger.warning(f"Email without sender email: {email.get('subject', 'No subject')}")
    
    # Keep only the first email from each sender
    deduplicated_emails = []
    duplicate_count = 0
    
    for sender_email, sender_emails in email_groups.items():
        if len(sender_emails) > 1:
            duplicate_count += len(sender_emails) - 1
            logger.debug(f"Found {len(sender_emails)} emails from {sender_email}, keeping first one")
        
        # Keep the first email (you could add logic here to keep the most recent instead)
        deduplicated_emails.append(sender_emails[0])
    
    logger.info(f"Deduplication completed: {len(deduplicated_emails)} unique senders, {duplicate_count} duplicates removed")
    
    return deduplicated_emails

def process_deduplication():
    """
    Main function to process deduplication:
    1. Load emails from both output directories
    2. Deduplicate by sender email
    3. Save deduplicated results
    """
    # Define paths
    msg_output_dir = Path("src/msg-processor/output")
    pst_output_dir = Path("src/pst-processor/output")
    contacts_dir = Path("src/contacts-extractor")
    
    # Ensure contacts directory exists
    contacts_dir.mkdir(parents=True, exist_ok=True)
    
    # Load emails from both directories
    all_emails = []
    
    if msg_output_dir.exists():
        msg_emails = load_json_files(msg_output_dir)
        all_emails.extend(msg_emails)
        logger.info(f"Loaded {len(msg_emails)} emails from MSG processor")
    else:
        logger.warning(f"MSG output directory {msg_output_dir} does not exist")
    
    if pst_output_dir.exists():
        pst_emails = load_json_files(pst_output_dir)
        all_emails.extend(pst_emails)
        logger.info(f"Loaded {len(pst_emails)} emails from PST processor")
    else:
        logger.warning(f"PST output directory {pst_output_dir} does not exist")
    
    if not all_emails:
        logger.warning("No emails found to process")
        return 0
    
    logger.info(f"Total emails loaded: {len(all_emails)}")
    
    # Deduplicate emails
    deduplicated_emails = deduplicate_emails(all_emails)
    
    # Save deduplicated emails
    if deduplicated_emails:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = contacts_dir / f"deduplicated_emails_{timestamp}.json"
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(deduplicated_emails, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Saved {len(deduplicated_emails)} deduplicated emails to {output_file}")
            
            # Also save a summary
            summary = {
                "total_emails_processed": len(all_emails),
                "unique_senders": len(deduplicated_emails),
                "duplicates_removed": len(all_emails) - len(deduplicated_emails),
                "timestamp": timestamp
            }
            
            summary_file = contacts_dir / f"deduplication_summary_{timestamp}.json"
            with open(summary_file, 'w', encoding='utf-8') as f:
                json.dump(summary, f, indent=2)
            
            logger.info(f"Saved deduplication summary to {summary_file}")
            
        except Exception as e:
            logger.error(f"Error saving deduplicated emails: {str(e)}")
            return 0
    
    return len(deduplicated_emails)

if __name__ == "__main__":
    result = process_deduplication()
    print(f"Processed {result} unique emails")