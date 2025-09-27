import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { askOllamaMistral } from './service/ollama/ollama.service';

interface EmailData {
  subject: string;
  messageId: string;
  senderName: string;
  senderEmail: string;
  body: string;
  sentAt: string;
}

interface ExtractedContact {
  company: string;
  full_name: string;
  department: string;
  primary_email: string;
  landline_phone: string;
  mobile_phone: string;
  full_address: string;
}

interface ContactResult extends ExtractedContact {
  extracted_at: string;
}

function sanitizeBodyContent(emailBody: string) {
  // Retirer tous les \r\n
  let cleaned = emailBody.replace(/\r\n/g, ' ');

  // Retirer tous les espaces multiples (plus de 2 espaces consécutifs)
  // et les remplacer par un seul espace
  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  // Optionnel : retirer les espaces en début et fin de chaîne
  cleaned = cleaned.trim();

  // Créer la date au format lisible
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  const extractedAt = `${day}/${month}/${year} - ${hours}:${minutes}`;

  return {
    body: cleaned,
    extracted_at: extractedAt
  };
}

async function extractContactInfo(emailData: EmailData): Promise<ExtractedContact> {
  try {
    // Prepare the object to analyze in the format expected by the service
    const objectToAnalyze = JSON.stringify({
      body: emailData.body,
      senderEmail: emailData.senderEmail,
      senderName: emailData.senderName,
      subject: emailData.subject
    });

    const extractedInfo = await askOllamaMistral(objectToAnalyze);

    if (extractedInfo) {
      // Convert from the service format to our expected format
      return {
        company: extractedInfo.company || '',
        full_name: extractedInfo.contact?.full_name || extractedInfo.contact?.first_name && extractedInfo.contact?.last_name
          ? `${extractedInfo.contact.first_name} ${extractedInfo.contact.last_name}`
          : extractedInfo.contact?.first_name || extractedInfo.contact?.last_name || '',
        department: extractedInfo.contact?.department || '',
        primary_email: extractedInfo.contact_info?.primary_email || emailData.senderEmail || '',
        landline_phone: extractedInfo.contact_info?.landline_phone || '',
        mobile_phone: extractedInfo.contact_info?.mobile_phone || '',
        full_address: extractedInfo.address?.full_address || [
          extractedInfo.address?.street,
          extractedInfo.address?.city,
          extractedInfo.address?.postal_code,
          extractedInfo.address?.country
        ].filter(Boolean).join(', ') || ''
      };
    }

    // Fallback: return basic info from email data
    return {
      company: '',
      full_name: emailData.senderName || '',
      department: '',
      primary_email: emailData.senderEmail || '',
      landline_phone: '',
      mobile_phone: '',
      full_address: ''
    };

  } catch (error) {
    console.error(`Error extracting contact info for ${emailData.senderEmail}:`, error);

    // Fallback: return basic info from email data
    return {
      company: '',
      full_name: emailData.senderName || '',
      department: '',
      primary_email: emailData.senderEmail || '',
      landline_phone: '',
      mobile_phone: '',
      full_address: ''
    };
  }
}

function readJsonFiles(): EmailData[] {
  const msgOutputDir = 'src/msg-processor/output';
  const pstOutputDir = 'src/pst-processor/output';
  const allEmails: EmailData[] = [];

  // Read MSG processor files
  try {
    const msgFiles = readdirSync(msgOutputDir).filter(file => file.endsWith('.json'));
    for (const file of msgFiles) {
      const filePath = join(msgOutputDir, file);
      const data = JSON.parse(readFileSync(filePath, 'utf-8'));
      allEmails.push(...data);
    }
  } catch (error) {
    console.error('Error reading MSG files:', error);
  }

  // Read PST processor files
  try {
    const pstFiles = readdirSync(pstOutputDir).filter(file => file.endsWith('.json'));
    for (const file of pstFiles) {
      const filePath = join(pstOutputDir, file);
      const data = JSON.parse(readFileSync(filePath, 'utf-8'));
      allEmails.push(...data);
    }
  } catch (error) {
    console.error('Error reading PST files:', error);
  }

  return allEmails;
}

function convertToCSV(contacts: ContactResult[]): string {
  const headers = [
    'company',
    'full_name',
    'department',
    'primary_email',
    'landline_phone',
    'mobile_phone',
    'full_address',
    'extracted_at'
  ];

  const csvRows = [headers.join(',')];

  for (const contact of contacts) {
    const row = headers.map(header => {
      const value = contact[header as keyof ContactResult] || '';
      // Escape commas and quotes in CSV
      return `"${value.toString().replace(/"/g, '""')}"`;
    });
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
}

async function main() {
  console.log('📧 Starting contact extraction from email files...');

  // Read all email data
  const emails = readJsonFiles();
  console.log(`Found ${emails.length} emails to process`);

  if (emails.length === 0) {
    console.log('No email files found. Please ensure files exist in:');
    console.log('- src/msg-processor/output/*.json');
    console.log('- src/pst-processor/output/*.json');
    return;
  }

  // Group emails by email address to avoid duplicates
  const emailGroups = new Map<string, EmailData>();
  for (const email of emails) {
    if (!emailGroups.has(email.senderEmail)) {
      emailGroups.set(email.senderEmail, email);
    }
  }
  
  const uniqueEmails = Array.from(emailGroups.values());
  console.log(`Grouped ${emails.length} emails into ${uniqueEmails.length} unique senders`);

  const contacts: ContactResult[] = [];
  let processed = 0;

  // Process each email
  for (const email of uniqueEmails) {
    console.log(`Processing ${++processed}/${uniqueEmails.length}: ${email.senderEmail}`);

    try {
      const { body, extracted_at } = sanitizeBodyContent(email.body)
      const extractedInfo = await extractContactInfo({ ...email, body });
      console.log(extractedInfo)
      const contactResult: ContactResult = {
        ...extractedInfo,
        extracted_at
      };

      contacts.push(contactResult);
    } catch (error) {
      console.error(`Failed to process email from ${email.senderEmail}:`, error);
    }
  }

  // Generate CSV
  const csvContent = convertToCSV(contacts);
  const outputPath = `extracted_contacts_${new Date().toISOString().split('T')[0]}.csv`;

  writeFileSync(outputPath, csvContent, 'utf-8');

  console.log(`✅ Contact extraction completed!`);
  console.log(`📄 Results saved to: ${outputPath}`);
  console.log(`📊 Processed ${contacts.length} contacts`);
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main, extractContactInfo, readJsonFiles, convertToCSV };