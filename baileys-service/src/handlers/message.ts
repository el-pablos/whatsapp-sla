import {
  WAMessage,
  WASocket,
  WAMessageUpdate,
  MessageUpsertType,
  proto,
} from "@whiskeysockets/baileys";
import { messageLogger as logger } from "../utils/logger";
import {
  extractPhoneFromJid,
  isGroupJid,
  formatTimestamp,
  sanitizeForLog,
} from "../utils/helpers";

export interface ProcessedMessage {
  id: string;
  from: string;
  fromPhone: string;
  to?: string;
  sender: string;
  senderPhone: string;
  text: string;
  type: string;
  timestamp: number;
  isGroup: boolean;
  groupName?: string;
  hasMedia: boolean;
  mediaType?: string;
  quotedMessage?: any;
  mentions?: string[];
  raw: WAMessage;
}

export interface MessageHandlerEvents {
  "message:received": (message: ProcessedMessage) => void;
  "message:sent": (message: ProcessedMessage) => void;
  "message:updated": (update: { id: string; status: string }) => void;
  "message:error": (error: Error, context?: any) => void;
}

/**
 * Message handler untuk memproses pesan WhatsApp masuk dan keluar
 */
export class MessageHandler {
  private socket: WASocket | null = null;

  constructor() {
    this.handleMessagesUpsert = this.handleMessagesUpsert.bind(this);
    this.handleMessageUpdate = this.handleMessageUpdate.bind(this);
  }

  /**
   * Set socket instance
   */
  public setSocket(socket: WASocket): void {
    this.socket = socket;
    this.setupMessageListeners();
  }

  /**
   * Setup message event listeners
   */
  private setupMessageListeners(): void {
    if (!this.socket) return;

    this.socket.ev.on("messages.upsert", this.handleMessagesUpsert);
    this.socket.ev.on("messages.update", this.handleMessageUpdate);
  }

  /**
   * Handle messages upsert (new/updated messages)
   */
  private async handleMessagesUpsert(event: {
    messages: WAMessage[];
    type: MessageUpsertType;
  }): Promise<void> {
    const { messages, type } = event;

    for (const message of messages) {
      try {
        // Skip jika message tidak valid
        if (!this.isValidMessage(message)) {
          continue;
        }

        const processed = await this.processMessage(message);

        if (type === "notify") {
          // Pesan masuk baru
          this.emit("message:received", processed);

          logger.info(
            {
              id: processed.id,
              from: sanitizeForLog(processed.from),
              type: processed.type,
              isGroup: processed.isGroup,
            },
            "Message received",
          );
        } else if (type === "append") {
          // Pesan keluar yang dikirim dari device lain
          this.emit("message:sent", processed);

          logger.info(
            {
              id: processed.id,
              to: sanitizeForLog(processed.to || ""),
              type: processed.type,
            },
            "Message sent",
          );
        }
      } catch (error) {
        logger.error(
          { error, messageId: message.key.id },
          "Error processing message",
        );
        this.emit("message:error", error as Error, { message });
      }
    }
  }

  /**
   * Handle message updates (status changes)
   */
  private async handleMessageUpdate(updates: WAMessageUpdate[]): Promise<void> {
    for (const update of updates) {
      try {
        const { key, update: messageUpdate } = update;

        if (messageUpdate.status) {
          this.emit("message:updated", {
            id: key.id || "",
            status: this.parseMessageStatus(messageUpdate.status),
          });

          logger.debug(
            {
              messageId: key.id,
              status: messageUpdate.status,
            },
            "Message status updated",
          );
        }
      } catch (error) {
        logger.error({ error, update }, "Error processing message update");
        this.emit("message:error", error as Error, { update });
      }
    }
  }

  /**
   * Process raw message menjadi format yang standar
   */
  private async processMessage(message: WAMessage): Promise<ProcessedMessage> {
    const key = message.key;
    const messageContent = message.message;

    // Extract basic info
    const from = key.remoteJid || "";
    const fromPhone = extractPhoneFromJid(from);
    const to = key.participant || undefined;
    const isGroup = isGroupJid(from);

    // Extract sender info
    let sender = "";
    let senderPhone = "";

    if (isGroup && key.participant) {
      sender = key.participant;
      senderPhone = extractPhoneFromJid(key.participant);
    } else {
      sender = from;
      senderPhone = fromPhone;
    }

    // Extract message text
    const text = this.extractMessageText(messageContent);

    // Extract message type
    const type = this.getMessageType(messageContent);

    // Extract media info
    const hasMedia = this.hasMediaContent(messageContent);
    const mediaType = hasMedia ? this.getMediaType(messageContent) : undefined;

    // Extract timestamp
    const timestamp =
      (message.messageTimestamp as number) || Math.floor(Date.now() / 1000);

    // Extract quoted message
    const quotedMessage = this.extractQuotedMessage(messageContent);

    // Extract mentions
    const mentions = this.extractMentions(messageContent);

    // Get group name if applicable
    let groupName: string | undefined;
    if (isGroup) {
      try {
        const groupMetadata = await this.socket?.groupMetadata(from);
        groupName = groupMetadata?.subject;
      } catch {
        // Ignore error getting group metadata
      }
    }

    return {
      id: key.id || "",
      from,
      fromPhone,
      to,
      sender,
      senderPhone,
      text,
      type,
      timestamp,
      isGroup,
      groupName,
      hasMedia,
      mediaType,
      quotedMessage,
      mentions,
      raw: message,
    };
  }

  /**
   * Validate apakah message valid untuk diproses
   */
  private isValidMessage(message: WAMessage): boolean {
    if (!message.key.id) return false;
    if (!message.key.remoteJid) return false;
    if (!message.message) return false;

    // Skip protocol messages
    if (message.message.protocolMessage) return false;

    return true;
  }

  /**
   * Extract text dari message content
   */
  private extractMessageText(messageContent: any): string {
    if (!messageContent) return "";

    // Text message
    if (messageContent.conversation) {
      return messageContent.conversation;
    }

    // Extended text message
    if (messageContent.extendedTextMessage?.text) {
      return messageContent.extendedTextMessage.text;
    }

    // Image with caption
    if (messageContent.imageMessage?.caption) {
      return messageContent.imageMessage.caption;
    }

    // Video with caption
    if (messageContent.videoMessage?.caption) {
      return messageContent.videoMessage.caption;
    }

    // Document with caption
    if (messageContent.documentMessage?.caption) {
      return messageContent.documentMessage.caption;
    }

    return "";
  }

  /**
   * Get message type
   */
  private getMessageType(messageContent: any): string {
    if (!messageContent) return "unknown";

    if (messageContent.conversation) return "text";
    if (messageContent.extendedTextMessage) return "text";
    if (messageContent.imageMessage) return "image";
    if (messageContent.videoMessage) return "video";
    if (messageContent.audioMessage) return "audio";
    if (messageContent.documentMessage) return "document";
    if (messageContent.stickerMessage) return "sticker";
    if (messageContent.locationMessage) return "location";
    if (messageContent.contactMessage) return "contact";
    if (messageContent.reactionMessage) return "reaction";

    return "unknown";
  }

  /**
   * Check apakah message memiliki media
   */
  private hasMediaContent(messageContent: any): boolean {
    if (!messageContent) return false;

    return !!(
      messageContent.imageMessage ||
      messageContent.videoMessage ||
      messageContent.audioMessage ||
      messageContent.documentMessage ||
      messageContent.stickerMessage
    );
  }

  /**
   * Get media type
   */
  private getMediaType(messageContent: any): string | undefined {
    if (messageContent.imageMessage) return "image";
    if (messageContent.videoMessage) return "video";
    if (messageContent.audioMessage) return "audio";
    if (messageContent.documentMessage) return "document";
    if (messageContent.stickerMessage) return "sticker";

    return undefined;
  }

  /**
   * Extract quoted message
   */
  private extractQuotedMessage(messageContent: any): any {
    const quotedInfo =
      messageContent?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedInfo) return undefined;

    return {
      id: messageContent.extendedTextMessage.contextInfo.stanzaId,
      text: this.extractMessageText({ message: quotedInfo }),
      participant: messageContent.extendedTextMessage.contextInfo.participant,
    };
  }

  /**
   * Extract mentions dari message
   */
  private extractMentions(messageContent: any): string[] | undefined {
    const contextInfo = messageContent?.extendedTextMessage?.contextInfo;
    return contextInfo?.mentionedJid || undefined;
  }

  /**
   * Parse message status code
   */
  private parseMessageStatus(status: number): string {
    switch (status) {
      case 0:
        return "pending";
      case 1:
        return "sent";
      case 2:
        return "delivered";
      case 3:
        return "read";
      default:
        return "unknown";
    }
  }

  /**
   * Send text message
   */
  public async sendMessage(
    to: string,
    text: string,
    options?: {
      quotedMessage?: WAMessage;
      mentions?: string[];
    },
  ): Promise<{ id: string; timestamp: number }> {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }

    logger.info(
      { to: sanitizeForLog(to), text: text.substring(0, 50) },
      "Sending message",
    );

    const message: any = { text };

    // Add quoted message if provided
    if (options?.quotedMessage) {
      message.contextInfo = {
        quotedMessage: options.quotedMessage.message,
        stanzaId: options.quotedMessage.key.id,
        participant:
          options.quotedMessage.key.participant ||
          options.quotedMessage.key.remoteJid,
      };
    }

    // Add mentions if provided
    if (options?.mentions && options.mentions.length > 0) {
      message.contextInfo = {
        ...message.contextInfo,
        mentionedJid: options.mentions,
      };
    }

    const result = await this.socket.sendMessage(to, message);

    return {
      id: result.key.id || "",
      timestamp:
        (result.messageTimestamp as number) || Math.floor(Date.now() / 1000),
    };
  }

  /**
   * Cleanup handler
   */
  public destroy(): void {
    if (this.socket) {
      this.socket.ev.off("messages.upsert", this.handleMessagesUpsert);
      this.socket.ev.off("messages.update", this.handleMessageUpdate);
    }

    this.socket = null;
    logger.info("Message handler destroyed");
  }

  // Event emitter stub - in real implementation, this would extend EventEmitter
  private emit(event: string, ...args: any[]): void {
    // Implementation would emit to parent socket manager or event bus
    logger.debug({ event }, "Emitting message event");
  }
}

export default MessageHandler;
