/**
 * Interface pour les pièces jointes d'un message
 */
interface Attachment {
  dataType: 'attachment';
  name: string;
  dataId: number;
  contentLength: number;
  extension: string;
  fileNameShort: string;
  fileName: string;
  attachMimeTag?: string;
  pidContentId?: string;
  creationTime: string;
  lastModificationTime: string;
  attachmentHidden: boolean;
}

/**
 * Interface pour les destinataires d'un message
 */
interface Recipient {
  dataType: 'recipient';
  name: string;
  addressType: 'SMTP' | 'EX';
  email: string;
  smtpAddress: string;
  recipType: 'to' | 'cc' | 'bcc';
}

/**
 * Interface principale pour les données d'un message email
 */
interface EmailData {
  // Type de données
  dataType: 'msg';

  // Pièces jointes
  attachments: Attachment[];

  // Destinataires
  recipients: Recipient[];

  // Informations du message
  messageClass: string;
  subject: string;
  conversationTopic: string;
  normalizedSubject: string;
  messageId: string;

  // En-têtes complets
  headers: string;

  // Expéditeur
  senderName: string;
  senderAddressType: 'SMTP' | 'EX';
  senderEmail: string;
  senderSmtpAddress: string;
  sentRepresentingSmtpAddress: string;
  creatorSMTPAddress: string;

  // Corps du message
  body: string;
  compressedRtf: Uint8Array;
  html: Uint8Array;

  // Informations de modification
  lastModifierName: string;
  lastModifierSMTPAddress: string;

  // Compte internet
  inetAcctName: string;

  // Horodatage
  creationTime: string;
  lastModificationTime: string;
  messageDeliveryTime: string;
  clientSubmitTime: string;

  // Paramètres de codage et localisation
  messageCodepage: number;
  internetCodepage: number;
  messageLocaleId: number;

  // Flags du message
  messageFlags: number;
}

/**
 * Interface pour la structure complète du fichier
 */
interface RawMsgFileData {
  dataType: 'msg';
  attachments: Attachment[];
  recipients: Recipient[];
  messageClass: string;
  subject: string;
  conversationTopic: string;
  headers: string;
  senderName: string;
  senderAddressType: string;
  senderEmail: string;
  normalizedSubject: string;
  body: string;
  compressedRtf: Uint8Array;
  html: Uint8Array;
  messageId: string;
  lastModifierName: string;
  senderSmtpAddress: string;
  sentRepresentingSmtpAddress: string;
  creatorSMTPAddress: string;
  lastModifierSMTPAddress: string;
  inetAcctName: string;
  creationTime: string;
  lastModificationTime: string;
  messageCodepage: number;
  messageFlags: number;
  messageDeliveryTime: string;
  internetCodepage: number;
  clientSubmitTime: string;
  messageLocaleId: number;
  // Optional: Added manually to keep track of the original file name
  fileName?: string;
}

/**
 * Type pour les types de données possibles
 */
type DataType = 'msg' | 'attachment' | 'recipient';

/**
 * Type pour les types d'adresse
 */
type AddressType = 'SMTP' | 'EX';

/**
 * Type pour les types de destinataires
 */
type RecipientType = 'to' | 'cc' | 'bcc';

/**
 * Interface optionnelle pour les métadonnées d'analyse
 */
interface EmailMetadata {
  hasAttachments: boolean;
  attachmentCount: number;
  recipientCount: number;
  isHtml: boolean;
  hasCompressedRtf: boolean;
  locale: string;
  encoding: {
    message: number;
    internet: number;
  };
}

/**
 * Fonction utilitaire pour extraire les métadonnées
 */
function extractMetadata(data: EmailData): EmailMetadata {
  return {
    hasAttachments: data.attachments.length > 0,
    attachmentCount: data.attachments.length,
    recipientCount: data.recipients.length,
    isHtml: data.html.length > 0,
    hasCompressedRtf: data.compressedRtf.length > 0,
    locale: data.messageLocaleId.toString(),
    encoding: {
      message: data.messageCodepage,
      internet: data.internetCodepage
    }
  };
}

interface ExtractedContactInfo {
  first_name?: string,
  last_name?: string,
  company_name?: string,
  address?: string,
  city?: string,
  post_code?: string,
  landline?: string,
  mobile?: string,
  email?: string,
  role?: string
}

export type {
  EmailData,
  RawMsgFileData,
  Attachment,
  Recipient,
  EmailMetadata,
  DataType,
  AddressType,
  RecipientType,
  ExtractedContactInfo
};

export { extractMetadata };