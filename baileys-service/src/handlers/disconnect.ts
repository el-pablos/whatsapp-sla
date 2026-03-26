import { DisconnectReason } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";

export interface DisconnectResult {
  shouldReconnect: boolean;
  shouldClearSession: boolean;
  reason: string;
  code: number;
  action: "reconnect" | "reauth" | "wait" | "fatal";
}

export function handleDisconnect(lastDisconnect: {
  error?: Error | Boom;
  date?: Date;
}): DisconnectResult {
  const error = lastDisconnect.error;
  const reason =
    error && "output" in error
      ? (error as Boom)?.output?.statusCode
      : undefined;

  switch (reason) {
    case DisconnectReason.loggedOut:
      return {
        shouldReconnect: false,
        shouldClearSession: true,
        reason: "Logged out from WhatsApp",
        code: reason,
        action: "reauth",
      };

    case DisconnectReason.connectionLost:
      return {
        shouldReconnect: true,
        shouldClearSession: false,
        reason: "Connection lost",
        code: reason,
        action: "reconnect",
      };

    case DisconnectReason.connectionClosed:
      return {
        shouldReconnect: true,
        shouldClearSession: false,
        reason: "Connection closed",
        code: reason,
        action: "reconnect",
      };

    case DisconnectReason.restartRequired:
      return {
        shouldReconnect: true,
        shouldClearSession: false,
        reason: "Restart required",
        code: reason,
        action: "reconnect",
      };

    case DisconnectReason.timedOut:
      return {
        shouldReconnect: true,
        shouldClearSession: false,
        reason: "Connection timed out",
        code: reason,
        action: "reconnect",
      };

    case DisconnectReason.badSession:
      return {
        shouldReconnect: false,
        shouldClearSession: true,
        reason: "Bad session file",
        code: reason,
        action: "reauth",
      };

    case DisconnectReason.connectionReplaced:
      return {
        shouldReconnect: false,
        shouldClearSession: false,
        reason: "Connection replaced by another session",
        code: reason,
        action: "fatal",
      };

    case DisconnectReason.multideviceMismatch:
      return {
        shouldReconnect: false,
        shouldClearSession: true,
        reason: "Multi-device mismatch",
        code: reason,
        action: "reauth",
      };

    default:
      return {
        shouldReconnect: false,
        shouldClearSession: false,
        reason: "Unknown disconnect",
        code: reason || 0,
        action: "wait",
      };
  }
}
