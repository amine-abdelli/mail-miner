import os
import json
import logging
from pathlib import Path
from datetime import datetime
import pypff

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

def extract_email_body(message):
    """Extract email body text from message"""
    try:
        # Try to get plain text body first
        if hasattr(message, 'get_plain_text_body'):
            body = message.get_plain_text_body()
            if body:
                return body.decode('utf-8', errors='ignore') if isinstance(body, bytes) else str(body)
        
        # Try RTF body
        if hasattr(message, 'get_rtf_body'):
            rtf_body = message.get_rtf_body()
            if rtf_body:
                return rtf_body.decode('utf-8', errors='ignore') if isinstance(rtf_body, bytes) else str(rtf_body)
        
        return ""
    except Exception as e:
        logger.warning(f"Error extracting body: {str(e)}")
        return ""

def process_pst_file(pst_path):
    """Process a single PST file and extract email information"""
    emails = []
    
    try:
        logger.info(f"Processing PST file: {pst_path}")
        
        # Open the PST file
        pst_file = pypff.file()
        pst_file.open(str(pst_path))
        
        # Get the root folder
        root = pst_file.get_root_folder()
        
        def process_folder(folder, folder_name=""):
            """Recursively process folders and extract emails"""
            try:
                # Process messages in current folder
                for i in range(folder.get_number_of_sub_messages()):
                    try:
                        message = folder.get_sub_message(i)
                        
                        # Extract email information using correct method names
                        subject = message.get_subject() if hasattr(message, 'get_subject') else ""
                        sender_name = message.get_sender_name() if hasattr(message, 'get_sender_name') else ""
                        delivery_time = message.get_delivery_time() if hasattr(message, 'get_delivery_time') else None
                        
                        # Get message ID from transport headers if available
                        message_id = ""
                        if hasattr(message, 'get_transport_headers'):
                            headers = message.get_transport_headers()
                            if headers and 'Message-ID' in str(headers):
                                import re
                                id_match = re.search(r'Message-ID:\s*([^\r\n]+)', str(headers))
                                if id_match:
                                    message_id = id_match.group(1).strip()
                        
                        # Extract sender email from transport headers or other sources
                        sender_email = ""
                        if hasattr(message, 'get_transport_headers'):
                            headers = message.get_transport_headers()
                            if headers:
                                # Look for From field in headers
                                import re
                                from_match = re.search(r'From:\s*([^\r\n]+)', str(headers))
                                if from_match:
                                    from_field = from_match.group(1).strip()
                                    # Extract email from From field
                                    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', from_field)
                                    if email_match:
                                        sender_email = email_match.group()
                        
                        email_data = {
                            "subject": subject or "",
                            "messageId": message_id,
                            "senderName": sender_name or "",
                            "senderEmail": sender_email,
                            "body": extract_email_body(message),
                            "sentAt": format_date(delivery_time)
                        }
                        
                        # Only add emails with valid sender email
                        if email_data["senderEmail"]:
                            emails.append(email_data)
                            
                    except Exception as e:
                        logger.warning(f"Error processing message {i}: {str(e)}")
                        continue
                
                # Process subfolders recursively
                for i in range(folder.get_number_of_sub_folders()):
                    try:
                        subfolder = folder.get_sub_folder(i)
                        subfolder_name = subfolder.get_name() or f"folder_{i}"
                        process_folder(subfolder, f"{folder_name}/{subfolder_name}")
                    except Exception as e:
                        logger.warning(f"Error processing subfolder {i}: {str(e)}")
                        continue
                        
            except Exception as e:
                logger.error(f"Error processing folder {folder_name}: {str(e)}")
        
        # Start processing from root
        process_folder(root)
        
        # Close the PST file
        pst_file.close()
        
        logger.info(f"Extracted {len(emails)} emails from {pst_path.name}")
        
    except Exception as e:
        logger.error(f"Error processing PST file {pst_path}: {str(e)}")
    
    return emails

def process_all_pst_files():
    """Process all PST files in the input directory"""
    # Define paths
    input_dir = Path("input")
    output_dir = Path("output")
    
    # Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Check if input directory exists
    if not input_dir.exists():
        logger.warning(f"Input directory {input_dir} does not exist")
        return
    
    # Get all PST files
    pst_files = list(input_dir.glob("*.pst"))
    
    if not pst_files:
        logger.warning(f"No PST files found in {input_dir}")
        return
    
    logger.info(f"Found {len(pst_files)} PST files to process")
    
    all_emails = []
    
    # Process each PST file
    for pst_file in pst_files:
        emails = process_pst_file(pst_file)
        all_emails.extend(emails)
    
    # Save all emails to JSON file
    if all_emails:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = output_dir / f"pst_emails_{timestamp}.json"
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(all_emails, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Saved {len(all_emails)} emails to {output_file}")
            
        except Exception as e:
            logger.error(f"Error saving emails to JSON: {str(e)}")
    
    else:
        logger.warning("No emails were extracted from PST files")
    
    return len(all_emails)

if __name__ == "__main__":
    process_all_pst_files()