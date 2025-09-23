import logger from '../logger/logger.service';
import * as MsgReader from '@kenjiuno/msgreader';
import path from 'path';
import { promises as fs } from 'fs';
import { FileData } from './msg.type';

export interface ParsedMsgFile {
  fileName: string
  filePath: string
  subject?: string
  from?: string
  date?: Date
  body?: string
}


/**
 * More comprehensive version that also cleans up extra whitespace
 */
function removeCidReferencesClean(text: string): string {
  // Remove CID patterns
  let cleanedText = text.replace(/\[cid:[^\]]+\]/g, '');

  // Clean up extra whitespace that might be left behind
  cleanedText = cleanedText
    .replace(/\s+/g, ' ')  // Multiple spaces to single space
    .replace(/\s+\n/g, '\n')  // Remove spaces before line breaks
    .replace(/\n\s+/g, '\n')  // Remove spaces after line breaks
    .trim();

  return cleanedText;
}

export function sanitizeMailContent(mailContent: string) {
  const mailContentWithoutCid = removeCidReferencesClean(mailContent);
  return mailContentWithoutCid
    .replaceAll(/\r\n/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim();
}


export async function parseFile(filePath: string): Promise<ParsedMsgFile | null> {
  try {
    logger.info('Starting to parse MSG file', { filePath })

    const buffer = await fs.readFile(filePath)
    const arrayBuffer = new ArrayBuffer(buffer.length)
    const view = new Uint8Array(arrayBuffer)
    view.set(buffer)
    const msgReader = new MsgReader.default(arrayBuffer)
    const fileInfo = msgReader.getFileData()

    const parsed: ParsedMsgFile = {
      fileName: path.basename(filePath),
      filePath,
      subject: fileInfo.subject || undefined,
      from: fileInfo.senderName || fileInfo.senderEmail || undefined,
      date: fileInfo.creationTime ? new Date(fileInfo.creationTime) : undefined,
      body: fileInfo.body || undefined,
    }

    logger.info('Successfully parsed MSG file', {
      fileName: parsed.fileName,
      subject: parsed.subject,
      from: parsed.from,
    })

    return parsed
  } catch (error) {
    logger.error('Failed to parse MSG file', {
      filePath,
      error: error instanceof Error ? error.message : String(error)
    })
    return null
  }
}

export function formatParsedData(parsed: ParsedMsgFile): string {
  return [
    `File: ${parsed.fileName}`,
    `Subject: ${parsed.subject || 'N/A'}`,
    `From: ${parsed.from || 'N/A'}`,
    `Date: ${parsed.date?.toISOString() || 'N/A'}`,
    `Body Length: ${parsed.body?.length || 0} chars`,
    '---'
  ].join('\n')
}

export function emailToSkip(mailContent: string, senderEmail: string): boolean {
  const mailContentKeyWords = [
    // Réunions et calendrier
    "Réunion Microsoft Teams",
    "Participez à partir de votre ordinateur",
    "Rejoindre Microsoft Teams",
    "Invitation à une réunion",
    "Meeting invitation",
    "Join Zoom Meeting",
    "Google Meet",
    "Webex Meeting",
    "Skype for Business",

    // Désabonnements et newsletters
    "Se désabonner",
    "Microsoft Outlook Reactions",
    "vous pouvez vous désabonner",
    "désabonnez vous",
    "désabonnez-vous",
    "unsubscribe",
    "opt-out",
    "manage preferences",
    "gérer vos préférences",
    "newsletter",
    "bulletin d'information",

    // Marketing et promotions
    "offre spéciale",
    "promotion",
    "soldes",
    "réduction",
    "code promo",
    "black friday",
    "cyber monday",
    "offre limitée",
    "dernière chance",
    "special offer",
    "discount",
    "save money",
    "free shipping",
    "livraison gratuite",

    // Notifications automatiques
    "notification automatique",
    "message automatique",
    "automatic notification",
    "automated message",
    "do not reply",
    "ne pas répondre",
    "ceci est un message automatique",
    "this is an automated",

    // Réseaux sociaux
    "a mentionné",
    "mentioned you",
    "liked your post",
    "commented on",
    "a commenté",
    "nouveau follower",
    "new follower",
    "friend request",
    "demande d'ami",
    "LinkedIn notification",
    "Facebook notification",
    "Twitter notification",

    // Sécurité générique (pas pro)
    "suspicious activity",
    "activité suspecte",
    "verify your account",
    "vérifiez votre compte",
    "update your password",
    "mettez à jour votre mot de passe",
    "account suspended",
    "compte suspendu",

    // E-commerce et achats
    "votre commande",
    "your order",
    "tracking number",
    "numéro de suivi",
    "livraison en cours",
    "shipped",
    "delivered",
    "retour produit",
    "product return",
    "review our product",
    "évaluez notre produit",

    // Spam patterns
    "félicitations",
    "congratulations",
    "you've won",
    "vous avez gagné",
    "claim your prize",
    "réclamez votre prix",
    "urgent action required",
    "action urgente requise",
    "click here now",
    "cliquez ici maintenant"
  ];

  const senderEmailKeyWords = [
    // Microsoft et services
    "@teams.microsoft.com",
    "@outlook.com",
    "@live.com",
    "@hotmail.com",
    "microsoft",

    // Notifications et no-reply
    "notification",
    "no-reply",
    "noreply",
    "nepasrepondre",
    "ne-pas-repondre",
    "donotreply",
    "ne-repondez-pas",
    "auto-reply",
    "autoreply",

    // Services automatisés
    "mailer-daemon",
    "postmaster",
    "admin",
    "support-auto",
    "automated",
    "automatique",
    "robot",
    "bot",

    // Réseaux sociaux
    "@linkedin.com",
    "@facebook.com",
    "@twitter.com",
    "@instagram.com",
    "@tiktok.com",
    "@snapchat.com",
    "@youtube.com",
    "social",

    // E-commerce et marketplaces
    "@amazon.com",
    "@ebay.com",
    "@paypal.com",
    "@stripe.com",
    "@shopify.com",
    "@woocommerce.com",
    "ecommerce",
    "marketplace",
    "boutique",
    "shop",
    "store",

    // Marketing et newsletters
    "marketing",
    "newsletter",
    "promo",
    "deals",
    "offers",
    "campaign",
    "broadcast",
    "bulk",

    // Services cloud généralistes
    "@dropbox.com",
    "@box.com",
    "@onedrive.com",
    "@icloud.com",

    // Spam indicators
    "temp",
    "temporary",
    "throwaway",
    "guerrilla",
    "10minutemail",
    "mailinator",

    // Services de livraison
    "@dhl.com",
    "@fedex.com",
    "@ups.com",
    "@laposte.fr",
    "@colissimo.fr",
    "delivery",
    "livraison",
    "transport",

    // Banques et finance (notifications automatiques)
    "carte-",
    "card-",
    "bank-notification",
    "alerte-bancaire"
  ];

  // Vérifier le contenu du mail
  const hasContentKeyword = mailContentKeyWords.some(phrase =>
    mailContent.toLowerCase().includes(phrase.toLowerCase())
  );

  // Vérifier l'email de l'expéditeur
  const hasSenderKeyword = senderEmailKeyWords.some(phrase =>
    senderEmail.toLowerCase().includes(phrase.toLowerCase())
  );

  // Vérifier si c'est un email très court (probablement automatique)
  const isVeryShort = mailContent.trim().length < 50;

  // Vérifier si le contenu contient beaucoup de liens (spam potential)
  const linkCount = (mailContent.match(/https?:\/\/[^\s<>"{}|\\^`\[\]]+/g) || []).length;
  const hasTooManyLinks = linkCount > 5 && mailContent.length < 1000;

  // Vérifier si le contenu est principalement des images (newsletters)
  const imageCount = (mailContent.match(/\[cid:|<img|\.jpg|\.png|\.gif/gi) || []).length;
  const isMainlyImages = imageCount > 3 && mailContent.replace(/\s/g, '').length < 500;

  return hasContentKeyword || hasSenderKeyword || isVeryShort || hasTooManyLinks || isMainlyImages;
}