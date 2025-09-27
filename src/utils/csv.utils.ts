import fs from 'fs';
import path from 'path';

interface ContactData {
  contact: {
    first_name: string | null;
    last_name: string | null;
    full_name: string;
    department: string;
  };
  company: string;
  contact_info: {
    primary_email: string;
    landline_phone: string | null;
    mobile_phone: string | null;
  };
  address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
    full_address: string;
  };
}

export function convertToCSV(data: ContactData[]): string {
  const headers = [
    'full_name',
    'department',
    'company',
    'primary_email',
    'landline_phone',
    'mobile_phone',
    'full_address'
  ];

  const csvRows = [headers.join(',')];

  for (const item of data) {
    console.log(item)
    console.log(item.contact)
    const row = [
      item.contact?.full_name || '',
      item.contact?.department || '',
      item.company,
      item.contact_info?.primary_email,
      item.contact_info?.landline_phone || '',
      item.contact_info?.mobile_phone || '',
      item.address?.full_address
    ];

    csvRows.push(row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
  }

  return csvRows.join('\n');
}

export function saveCSV(data: ContactData[], filename: string): void {

  const csv = convertToCSV(data);
  fs.writeFileSync(filename, csv, 'utf8');
  console.log(`CSV file saved as ${filename}`);
}

export function processJSONToCSV(): void {
  const inputPath = path.join(process.cwd(), 'export', 'input', 'finalResponses.json');
  const outputPath = path.join(process.cwd(), 'export', 'output', 'contacts.csv');

  try {
    const jsonData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    saveCSV(jsonData, outputPath);
  } catch (error) {
    console.error('Error processing JSON to CSV:', error);
  }
}

processJSONToCSV();
