import {
  jidDecode,
  jidEncode,
  jidNormalizedUser,
  type S_Whatsapp_JID,
} from "@whiskeysockets/baileys";

/**
 * Format phone number ke JID WhatsApp
 */
export function formatPhoneToJid(phone: string): string {
  // Remove non-numeric characters
  let cleaned = phone.replace(/[^0-9]/g, "");

  // Convert 0xxx to 62xxx for Indonesian numbers
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  }

  // Return JID format
  return `${cleaned}@s.whatsapp.net`;
}

/**
 * Extract phone number from JID
 */
export function extractPhoneFromJid(jid: string): string {
  const decoded = jidDecode(jid);
  return decoded?.user || jid;
}

/**
 * Check if JID is a group
 */
export function isGroupJid(jid: string): boolean {
  return jid.endsWith("@g.us");
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[^0-9]/g, "");
  // Indonesian phone numbers: 8-15 digits
  return cleaned.length >= 8 && cleaned.length <= 15;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function dengan exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error("Retry failed");
}

/**
 * Sanitize string untuk logging (hide sensitive data)
 */
export function sanitizeForLog(str: string, keepChars: number = 4): string {
  if (str.length <= keepChars * 2) {
    return "*".repeat(str.length);
  }
  return `${str.substring(0, keepChars)}${"*".repeat(str.length - keepChars * 2)}${str.substring(str.length - keepChars)}`;
}

/**
 * Format timestamp untuk display
 */
export function formatTimestamp(timestamp?: number): string {
  if (!timestamp) {
    return new Date().toISOString();
  }
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Parse error message dengan aman
 */
export function parseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return JSON.stringify(error);
}

/**
 * Generate unique ID
 */
export function generateId(prefix: string = "msg"): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if object is empty
 */
export function isEmpty(obj: unknown): boolean {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === "string") return obj.trim() === "";
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === "object") return Object.keys(obj).length === 0;
  return false;
}
