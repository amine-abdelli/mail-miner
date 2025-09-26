import os
import json
import logging
import re
from pathlib import Path
from datetime import datetime
import extract_msg

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def format_date(date_obj):
    """Format date object to string in the required format"""
    if date_obj is None:
        return None
    try:
        if hasattr(date_obj, 'strftime'):
            return date_obj.strftime("%d/%m/%Y - %Hh%M")
        else:
            return str(date_obj)
    except:
        return str(date_obj)

def extract_sender_email(msg):
    """Extract sender email from MSG object"""
    # First, try to extract email from sender field using regex
    if msg.sender:
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        email_match = re.search(email_pattern, msg.sender)
        if email_match:
            return email_match.group()
    
    # If no email in sender, check the "From" header
    if hasattr(msg, 'headerDict') and msg.headerDict:
        from_header = msg.headerDict.get('from') or msg.headerDict.get('From')
        if from_header:
            email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', from_header)
            if email_match:
                return email_match.group()
    
    # For MSG files, the sender is usually the person who sent TO the recipients
    # So we need to look elsewhere. Try checking the recipients to understand the flow
    # In many cases, we might need to infer from context or use a different approach
    
    return None

def process_msg_file(msg_path):
    """Process a single MSG file and extract email information"""
    emails = []
    
    try:
        logger.info(f"Processing MSG file: {msg_path}")
        
        # Open and parse the MSG file
        msg = extract_msg.Message(str(msg_path))
        
        # Extract sender email using our custom function
        sender_email = extract_sender_email(msg)
        sender_name = msg.sender or ""
        
        # Clean up sender name (remove email if it's there)
        if sender_name and '<' in sender_name and '>' in sender_name:
            # Extract just the name part before <email>
            name_part = sender_name.split('<')[0].strip()
            if name_part:
                sender_name = name_part.strip('"')
        
        # Extract email information
        email_data = {
            "subject": msg.subject or "",
            "messageId": msg.messageId or "",
            "senderName": sender_name,
            "senderEmail": sender_email or "",
            "body": msg.body or "",
            "sentAt": format_date(msg.date)
        }
        
        # Only add emails with valid sender email
        if email_data["senderEmail"]:
            emails.append(email_data)
            logger.info(f"Extracted email from {msg_path.name}: {email_data['subject'][:50]}...")
        else:
            logger.warning(f"No sender email found in {msg_path.name}")
        
        # Close the message
        msg.close()
        
    except Exception as e:
        logger.error(f"Error processing MSG file {msg_path}: {str(e)}")
    
    return emails

def process_all_msg_files():
    """Process all MSG files in the input directory"""
    # Define paths
    input_dir = Path("input")
    output_dir = Path("output")
    
    # Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Check if input directory exists
    if not input_dir.exists():
        logger.warning(f"Input directory {input_dir} does not exist")
        return
    
    # Get all MSG files
    msg_files = list(input_dir.glob("*.msg"))
    
    if not msg_files:
        logger.warning(f"No MSG files found in {input_dir}")
        return
    
    logger.info(f"Found {len(msg_files)} MSG files to process")
    
    all_emails = []
    
    # Process each MSG file
    for msg_file in msg_files:
        emails = process_msg_file(msg_file)
        all_emails.extend(emails)
    
    # Save all emails to JSON file
    if all_emails:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = output_dir / f"msg_emails_{timestamp}.json"
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(all_emails, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Saved {len(all_emails)} emails to {output_file}")
            
        except Exception as e:
            logger.error(f"Error saving emails to JSON: {str(e)}")
    
    else:
        logger.warning("No emails were extracted from MSG files")
    
    return len(all_emails)

if __name__ == "__main__":
    process_all_msg_files()