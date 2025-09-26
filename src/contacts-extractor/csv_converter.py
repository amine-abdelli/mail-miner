import os
import json
import csv
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Dict

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def convert_contacts_to_csv():
    """
    Convert extracted contacts JSON to CSV format
    """
    # Define paths
    contacts_dir = Path("src/contacts-extractor")
    
    # Find the latest extracted contacts file
    contacts_files = list(contacts_dir.glob("extracted_contacts_*.json"))
    
    if not contacts_files:
        logger.error("No extracted contacts file found. Please run contact extraction first.")
        return 0
    
    # Get the most recent file
    latest_file = max(contacts_files, key=lambda x: x.stat().st_mtime)
    logger.info(f"Converting contacts from: {latest_file}")
    
    # Load extracted contacts
    try:
        with open(latest_file, 'r', encoding='utf-8') as f:
            contacts = json.load(f)
        logger.info(f"Loaded {len(contacts)} extracted contacts")
    except Exception as e:
        logger.error(f"Error loading extracted contacts: {str(e)}")
        return 0
    
    if not contacts:
        logger.warning("No contacts to convert")
        return 0
    
    # Define CSV headers (matching the required output format)
    headers = [
        "email",
        "full_name", 
        "mobile_phone",
        "landline_phone",
        "company",
        "role",
        "address",
        "source_email",
        "source_subject",
        "extraction_timestamp"
    ]
    
    # Generate output filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_file = contacts_dir / f"contacts_export_{timestamp}.csv"
    
    try:
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            
            # Write header
            writer.writeheader()
            
            # Write contact data
            for contact in contacts:
                # Create row with all required fields
                row = {}
                for header in headers:
                    row[header] = contact.get(header, '')
                    # Convert None values to empty strings for CSV
                    if row[header] is None:
                        row[header] = ''
                
                writer.writerow(row)
        
        logger.info(f"Successfully converted {len(contacts)} contacts to CSV: {csv_file}")
        
        # Create a summary report
        summary = {
            "total_contacts": len(contacts),
            "csv_file": str(csv_file),
            "timestamp": timestamp,
            "fields_exported": headers,
            "contacts_with_phone": sum(1 for c in contacts if c.get('mobile_phone') or c.get('landline_phone')),
            "contacts_with_company": sum(1 for c in contacts if c.get('company')),
            "contacts_with_address": sum(1 for c in contacts if c.get('address')),
            "contacts_with_role": sum(1 for c in contacts if c.get('role'))
        }
        
        summary_file = contacts_dir / f"csv_export_summary_{timestamp}.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2)
        
        logger.info(f"CSV export summary saved to: {summary_file}")
        logger.info(f"Export statistics:")
        logger.info(f"  - Total contacts: {summary['total_contacts']}")
        logger.info(f"  - With phone: {summary['contacts_with_phone']}")
        logger.info(f"  - With company: {summary['contacts_with_company']}")
        logger.info(f"  - With address: {summary['contacts_with_address']}")
        logger.info(f"  - With role: {summary['contacts_with_role']}")
        
        return len(contacts)
        
    except Exception as e:
        logger.error(f"Error writing CSV file: {str(e)}")
        return 0

def create_detailed_csv():
    """
    Create a more detailed CSV with additional analysis
    """
    contacts_dir = Path("src/contacts-extractor")
    
    # Find the latest extracted contacts file
    contacts_files = list(contacts_dir.glob("extracted_contacts_*.json"))
    
    if not contacts_files:
        logger.error("No extracted contacts file found")
        return 0
    
    latest_file = max(contacts_files, key=lambda x: x.stat().st_mtime)
    
    try:
        with open(latest_file, 'r', encoding='utf-8') as f:
            contacts = json.load(f)
    except Exception as e:
        logger.error(f"Error loading contacts: {str(e)}")
        return 0
    
    # Extended headers for detailed analysis
    detailed_headers = [
        "email",
        "full_name",
        "mobile_phone", 
        "landline_phone",
        "company",
        "role",
        "address",
        "source_email",
        "source_subject",
        "extraction_timestamp",
        "has_phone",
        "phone_type", 
        "company_domain",
        "name_completeness",
        "data_completeness_score"
    ]
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    detailed_csv_file = contacts_dir / f"contacts_detailed_{timestamp}.csv"
    
    try:
        with open(detailed_csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=detailed_headers)
            writer.writeheader()
            
            for contact in contacts:
                # Calculate additional fields
                has_phone = bool(contact.get('mobile_phone') or contact.get('landline_phone'))
                
                phone_type = ""
                if contact.get('mobile_phone'):
                    phone_type = "mobile"
                elif contact.get('landline_phone'):
                    phone_type = "landline"
                
                # Extract domain from email
                company_domain = ""
                if contact.get('email'):
                    try:
                        company_domain = contact['email'].split('@')[1]
                    except:
                        pass
                
                # Check name completeness
                name_completeness = "none"
                if contact.get('full_name'):
                    name_completeness = "full"
                
                # Calculate data completeness score (0-100)
                fields_to_check = ['email', 'full_name', 'mobile_phone', 'landline_phone', 'company', 'role', 'address']
                filled_fields = sum(1 for field in fields_to_check if contact.get(field))
                completeness_score = round((filled_fields / len(fields_to_check)) * 100, 1)
                
                # Create detailed row
                detailed_row = {}
                for header in detailed_headers:
                    if header in contact:
                        detailed_row[header] = contact[header] or ''
                    elif header == 'has_phone':
                        detailed_row[header] = has_phone
                    elif header == 'phone_type':
                        detailed_row[header] = phone_type
                    elif header == 'company_domain':
                        detailed_row[header] = company_domain
                    elif header == 'name_completeness':
                        detailed_row[header] = name_completeness
                    elif header == 'data_completeness_score':
                        detailed_row[header] = completeness_score
                    else:
                        detailed_row[header] = ''
                
                writer.writerow(detailed_row)
        
        logger.info(f"Created detailed CSV with analysis: {detailed_csv_file}")
        return len(contacts)
        
    except Exception as e:
        logger.error(f"Error creating detailed CSV: {str(e)}")
        return 0

if __name__ == "__main__":
    # Convert to standard CSV
    result1 = convert_contacts_to_csv()
    
    # Create detailed CSV with analysis
    result2 = create_detailed_csv()
    
    print(f"Converted {result1} contacts to CSV")
    if result2:
        print(f"Created detailed CSV with {result2} contacts")