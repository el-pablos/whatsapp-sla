/**
 * Mock module untuk @whiskeysockets/baileys
 * Digunakan untuk testing tanpa koneksi WhatsApp asli
 */

// DisconnectReason enum untuk testing reconnect behavior
export const DisconnectReason = {
  connectionClosed: 428,
  connectionLost: 408,
  connectionReplaced: 440,
  timedOut: 408,
  loggedOut: 401,
  badSession: 500,
  restartRequired: 515,
  multideviceMismatch: 411,
  forbidden: 403,
  unavailableService: 503,
} as const;

// Type for DisconnectReason
export type DisconnectReason =
  (typeof DisconnectReason)[keyof typeof DisconnectReason];

// Mock AuthenticationState
export interface AuthenticationState {
  creds: {
    registered: boolean;
    me?: {
      id: string;
      name?: string;
    };
  };
  keys: Record<string, unknown>;
}

// Mock WASocket type
export interface WASocket {
  ev: {
    on: jest.Mock;
    off: jest.Mock;
    emit: jest.Mock;
  };
  user?: {
    id: string;
    name?: string;
  };
  authState?: AuthenticationState;
  requestPairingCode: jest.Mock;
  sendMessage: jest.Mock;
  logout: jest.Mock;
  end: jest.Mock;
  ws: {
    close: jest.Mock;
  };
}

// Mock useMultiFileAuthState
export const useMultiFileAuthState = jest.fn().mockResolvedValue({
  state: {
    creds: {
      registered: false,
    },
    keys: {},
  },
  saveCreds: jest.fn().mockResolvedValue(undefined),
});

// Mock makeWASocket (default export)
export const makeWASocket = jest.fn().mockReturnValue({
  ev: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  user: undefined,
  authState: {
    creds: { registered: false },
    keys: {},
  },
  requestPairingCode: jest.fn().mockResolvedValue("1234-5678"),
  sendMessage: jest.fn().mockResolvedValue({
    key: { id: "mock-message-id" },
  }),
  logout: jest.fn().mockResolvedValue(undefined),
  end: jest.fn(),
  ws: {
    close: jest.fn(),
  },
} as unknown as WASocket);

// Default export
export default makeWASocket;

// Mock untuk WAProto
export const proto = {
  Message: {},
  WebMessageInfo: {},
};

// Mock untuk Browsers
export const Browsers = {
  ubuntu: jest.fn().mockReturnValue(["Ubuntu", "Chrome", "22.0"]),
  macOS: jest.fn().mockReturnValue(["Mac OS", "Safari", "537.36"]),
  windows: jest.fn().mockReturnValue(["Windows", "Edge", "110.0"]),
  appropriate: jest.fn().mockReturnValue(["Linux", "Chrome", "108.0"]),
};

// Mock untuk delay utility
export const delay = jest.fn().mockResolvedValue(undefined);

// Mock untuk fetchLatestBaileysVersion
export const fetchLatestBaileysVersion = jest.fn().mockResolvedValue({
  version: [2, 2413, 1],
  isLatest: true,
});

// Mock untuk jidEncode/jidDecode
export const jidEncode = jest.fn((user: string, server = "s.whatsapp.net") => {
  return `${user}@${server}`;
});

export const jidDecode = jest.fn((jid: string) => {
  const [user, server] = jid.split("@");
  return { user, server };
});

// Mock untuk isJidGroup/isJidBroadcast
export const isJidGroup = jest.fn((jid: string) => jid.endsWith("@g.us"));
export const isJidBroadcast = jest.fn((jid: string) =>
  jid.includes("broadcast"),
);
export const isJidUser = jest.fn(
  (jid: string) => !isJidGroup(jid) && !isJidBroadcast(jid),
);

// Mock untuk downloadMediaMessage
export const downloadMediaMessage = jest
  .fn()
  .mockResolvedValue(Buffer.from([]));

// Mock untuk generateMessageID
export const generateMessageID = jest.fn().mockReturnValue("mock-msg-id-12345");
