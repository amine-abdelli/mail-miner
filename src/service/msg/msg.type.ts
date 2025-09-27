export interface ExtractedContactInfo {
  contact: {
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    department: string | null;
  };
  company: string | null;
  contact_info: {
    primary_email: string | null;
    landline_phone: string | null;
    mobile_phone: string | null;
  };
  address: {
    street: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
    full_address: string | null;
  };
}