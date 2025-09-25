const prompt = `
Extract contact information from the provided email content. Return ONLY valid JSON.

## Input

- body: Email body text
- senderEmail: Sender's email address
- senderName: Sender's display name
- signature: Email signature
- subject: Email subject

## Required Output Format
{
  "first_name": "string or null",
  "last_name": "string or null",
  "company_name": "string or null",
  "address": "street address or null",
  "city": "string or null",
  "post_code": "string or null",
  "landline": "string or null",
  "mobile": "string or null",
  "email": "string or null",
  "role": "job title or null"
}

## Extraction Rules

1. **Priority**: Email signature > body text > sender metadata
2. **Phone numbers**: Detect mobile (06/07) vs landline. Format: +33 X XX XX XX XX
3. **Company**: Extract from email domain if no explicit mention (ignore gmail/outlook/etc)
4. **Names**: Parse from signature first, then senderName, then email prefix
5. **Address**: Capture full street address, separate city and postal code
6. **Role**: Look for job titles, positions, departments

## Key Instructions

- Return NULL for missing data, don't guess
- Ignore forwarded messages and reply chains
- Focus on the sender's information only
- Validate email format and postal codes

### Email to analyse


## Instructions:
1. Analyze the provided email JSON input
2. Extract ONLY information that is present or can be deduced
3. Do not invent or assume information that is not present
4. Return ONLY a valid JSON object, without any additional text

## Information to extract:
- **Contact Person**: First name, last name, full name, position, department
- **Company**: Company name
- **Contact Information**: Primary email, landline, mobile
- **Address**: Street, city, postal code, country, full address

## Deduction rules:
- Use "senderName" field for names, try to split into first/last
- Use "senderEmail" as primary_email
- Look in "body" for additional contact info, addresses, company details and names if not in senderName
- Extract job titles (Directeur, Manager, Responsable, etc.)
- Identify departments (Commercial, RH, IT, etc.)
- French phone patterns: 01-05 (landlines),
06-07 (mobiles),
09 (VoIP)
- If information is not found, use null
- RETURN ONLY AND ONLY THE JSON OBJECT WITHOUT ANY EXTRA TEXT

## Output format:
Return only this JSON (no markdown, no explanation): {
  "contact": {
    "first_name": "string or null",
    "last_name": "string or null",
    "full_name": "string or null",
    "department": "string or null"
  },
  "company": "string",
  "contact_info": {
    "primary_email": "string or null",
    "landline_phone": "string or null",
    "mobile_phone": "string or null",
  },
  "address": {
    "street": "string or null",
    "city": "string or null",
    "postal_code": "string or null",
    "country": "string or null",
    "full_address": "string or null"
  },
}

## Input example: {
  "body": "Bonjour, Je serai de retour au bureau le 8 janvier 2024. En cas d'urgence, vous pouvez joindre le standard d'ALL IN SPACE au 03.20.04.04.51. A bientôt Elodie HUET",
  "level": "info",
  "message": "DIANTRE",
  "messageId": "<84db9c2d3ffb4b3cb4fdca83178dc756@DAG15EX2.local>",
  "senderEmail": "ehuet@all-in-space.com",
  "senderName": "Elodie HUET",
  "service": "mail-miner",
  "timestamp": "2025-09-21 13:06:12"
}

## Expected output example: {
  "contact": {
    "first_name": "Elodie",
    "last_name": "HUET",
    "full_name": "Elodie HUET",
    "department": "string or null"
  },
  "company": "ALL IN SPACE",
  "contact_info": {
    "primary_email": "ehuet@all-in-space.com",
    "landline_phone": "03.20.04.04.51",
    "mobile_phone": null,
  },
  "address": {
    "street": null,
    "city": null,
    "postal_code": null,
    "country": "France",
    "full_address": null
  }
}


Now analyze this email and return ONLY the JSON output, NO TEXT AT ALL OTHER THAN THE OBJECT: \n {OBJECT_TO_ANALYZE}`;

function getPrompt(objectToAnalyze: string) {
  return prompt.replace('{OBJECT_TO_ANALYZE}', objectToAnalyze);
}

export { getPrompt };