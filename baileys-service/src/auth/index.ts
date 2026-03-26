/**
 * Authentication module untuk Baileys WhatsApp service
 *
 * Module ini menyediakan berbagai handler untuk authentication:
 * - PairingHandler: Handler untuk pairing code authentication
 *
 * @module auth
 */

export {
  PairingHandler,
  type PhoneValidationResult,
  type PairingCodeResult,
  type PairingHandlerEvents,
} from "./pairing-handler";

// Re-export commonly used types
export type { WASocket } from "@whiskeysockets/baileys";
