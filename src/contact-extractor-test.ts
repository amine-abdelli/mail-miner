import { readFileSync, writeFileSync } from 'fs';
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
  console.log('📧 Starting contact extraction test with sample emails...');

  // Read just the first 5 emails from MSG processor
  const msgFile = 'src/msg-processor/output/msg_emails_20250926_140439.json';
  const emails: EmailData[] = JSON.parse(readFileSync(msgFile, 'utf-8')).slice(0, 5);

  console.log(`Testing with ${emails.length} sample emails`);

  const contacts: ContactResult[] = [];
  let processed = 0;

  // Process each email
  for (const email of emails) {
    console.log(`Processing ${++processed}/${emails.length}: ${email.senderEmail}`);

    try {
      const extractedInfo = await extractContactInfo(email);

      const contactResult: ContactResult = {
        ...extractedInfo,
        extracted_at: new Date().toISOString()
      };

      contacts.push(contactResult);

      console.log(`✅ Extracted: ${extractedInfo.full_name} from ${extractedInfo.company || 'Unknown Company'}`);

      // Small delay to avoid overwhelming Ollama
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`Failed to process email from ${email.senderEmail}:`, error);
    }
  }

  // Generate CSV
  const csvContent = convertToCSV(contacts);
  const outputPath = `test_contacts_${new Date().toISOString().split('T')[0]}.csv`;

  writeFileSync(outputPath, csvContent, 'utf-8');

  console.log(`✅ Test completed!`);
  console.log(`📄 Results saved to: ${outputPath}`);
  console.log(`📊 Processed ${contacts.length} contacts`);

  // Show preview
  console.log('\n📋 Sample results:');
  contacts.forEach((contact, index) => {
    console.log(`${index + 1}. ${contact.full_name} (${contact.company}) - ${contact.primary_email}`);
  });
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}