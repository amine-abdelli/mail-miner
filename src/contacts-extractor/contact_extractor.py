import os
import json
import logging
import requests
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Ollama configuration
OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "qwen2.5:7b"

def get_contact_extraction_prompt(email_data: str) -> str:
    """Generate the prompt for contact extraction"""
    prompt = """
Extract contact information from the provided email content. Return ONLY valid JSON.

## Input
- subject: Email subject
- messageId: Message identifier  
- senderName: Sender's display name
- senderEmail: Sender's email address
- body: Email body text
- sentAt: Send timestamp

## Required Output Format
{
  "email": "string or null",
  "full_name": "string or null", 
  "mobile_phone": "string or null",
  "landline_phone": "string or null",
  "company": "string or null",
  "role": "string or null",
  "address": "string or null"
}

## Extraction Rules

1. **Priority**: Email signature > body text > sender metadata
2. **Phone numbers**: Detect mobile (06/07) vs landline (01-05). Format: +33 X XX XX XX XX
3. **Company**: Extract from email domain if no explicit mention (ignore gmail/outlook/etc)
4. **Names**: Parse from signature first, then senderName, then email prefix
5. **Address**: Capture full street address including city and postal code
6. **Role**: Look for job titles, positions, departments

## Key Instructions

- Return NULL for missing data, don't guess
- Ignore forwarded messages and reply chains
- Focus on the sender's information only
- Validate email format and postal codes
- Use "senderEmail" as primary email
- Look in "body" for additional contact info, addresses, company details
- Extract job titles (Directeur, Manager, Responsable, etc.)
- Identify departments (Commercial, RH, IT, etc.)
- French phone patterns: 01-05 (landlines), 06-07 (mobiles), 09 (VoIP)
- If information is not found, use null
- RETURN ONLY THE JSON OBJECT WITHOUT ANY EXTRA TEXT

Now analyze this email and return ONLY the JSON output: """ + email_data
    
    return prompt

def call_ollama_api(prompt: str) -> Optional[Dict]:
    """Call Ollama API to extract contact information"""
    try:
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
        }
        
        response = requests.post(
            OLLAMA_API_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        if not response.ok:
            logger.error(f"Ollama API error: {response.status_code} - {response.text}")
            return None
        
        data = response.json()
        
        # Parse the response
        try:
            parsed_response = json.loads(data["response"])
            return parsed_response
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse Ollama response as JSON: {e}")
            logger.warning(f"Raw response: {data['response']}")
            return None
            
    except Exception as e:
        logger.error(f"Error calling Ollama API: {str(e)}")
        return None

def extract_contact_from_email(email: Dict) -> Optional[Dict]:
    """Extract contact information from a single email"""
    try:
        # Create the prompt with email data
        email_json = json.dumps(email, ensure_ascii=False)
        prompt = get_contact_extraction_prompt(email_json)
        
        # Call Ollama API
        contact_info = call_ollama_api(prompt)
        
        if contact_info:
            # Ensure all required fields are present
            required_fields = ["email", "full_name", "mobile_phone", "landline_phone", "company", "role", "address"]
            for field in required_fields:
                if field not in contact_info:
                    contact_info[field] = None
            
            logger.debug(f"Extracted contact for {email.get('senderEmail', 'unknown')}")
            return contact_info
        else:
            logger.warning(f"Failed to extract contact info for {email.get('senderEmail', 'unknown')}")
            return None
            
    except Exception as e:
        logger.error(f"Error processing email: {str(e)}")
        return None

def process_contact_extraction():
    """
    Main function to process contact extraction:
    1. Load deduplicated emails
    2. Extract contact information using Ollama
    3. Save results
    """
    # Define paths
    contacts_dir = Path("src/contacts-extractor")
    temp_dir = contacts_dir / "temp"
    
    # Ensure directories exist
    contacts_dir.mkdir(parents=True, exist_ok=True)
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    # Find the latest deduplicated emails file
    deduplicated_files = list(contacts_dir.glob("deduplicated_emails_*.json"))
    
    if not deduplicated_files:
        logger.error("No deduplicated emails file found. Please run deduplication first.")
        return 0
    
    # Get the most recent file
    latest_file = max(deduplicated_files, key=lambda x: x.stat().st_mtime)
    logger.info(f"Processing contacts from: {latest_file}")
    
    # Load deduplicated emails
    try:
        with open(latest_file, 'r', encoding='utf-8') as f:
            emails = json.load(f)
        logger.info(f"Loaded {len(emails)} deduplicated emails")
    except Exception as e:
        logger.error(f"Error loading deduplicated emails: {str(e)}")
        return 0
    
    # Process each email to extract contact information
    extracted_contacts = []
    failed_extractions = 0
    
    for i, email in enumerate(emails, 1):
        logger.info(f"Processing email {i}/{len(emails)}: {email.get('senderEmail', 'unknown')}")
        
        contact_info = extract_contact_from_email(email)
        
        if contact_info:
            # Add original email metadata for reference
            contact_with_metadata = {
                **contact_info,
                "source_email": email.get('senderEmail'),
                "source_subject": email.get('subject'),
                "extraction_timestamp": datetime.now().isoformat()
            }
            extracted_contacts.append(contact_with_metadata)
        else:
            failed_extractions += 1
        
        # Save intermediate results every 10 contacts (for safety)
        if i % 10 == 0:
            temp_file = temp_dir / f"contacts_temp_{i}.json"
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(extracted_contacts, f, indent=2, ensure_ascii=False)
            logger.info(f"Saved intermediate results: {len(extracted_contacts)} contacts")
    
    # Save final results
    if extracted_contacts:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = contacts_dir / f"extracted_contacts_{timestamp}.json"
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(extracted_contacts, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Saved {len(extracted_contacts)} extracted contacts to {output_file}")
            
            # Save summary
            summary = {
                "total_emails_processed": len(emails),
                "successful_extractions": len(extracted_contacts),
                "failed_extractions": failed_extractions,
                "success_rate": f"{(len(extracted_contacts)/len(emails)*100):.1f}%",
                "timestamp": timestamp
            }
            
            summary_file = contacts_dir / f"extraction_summary_{timestamp}.json"
            with open(summary_file, 'w', encoding='utf-8') as f:
                json.dump(summary, f, indent=2)
            
            logger.info(f"Extraction completed. Success rate: {summary['success_rate']}")
            
            # Clean up temp files
            for temp_file in temp_dir.glob("contacts_temp_*.json"):
                temp_file.unlink()
            
        except Exception as e:
            logger.error(f"Error saving extracted contacts: {str(e)}")
            return 0
    
    else:
        logger.warning("No contacts were successfully extracted")
    
    return len(extracted_contacts)

if __name__ == "__main__":
    result = process_contact_extraction()
    print(f"Extracted {result} contacts")