# Pairing Handler - WhatsApp Authentication

Pairing Handler adalah komponen untuk melakukan autentikasi WhatsApp menggunakan **pairing code** sebagai alternatif dari QR code. Dengan pairing code, user dapat memasukkan 8 digit kode di aplikasi WhatsApp mobile mereka untuk menghubungkan bot.

## Features

- Request pairing code untuk nomor telepon tertentu
- Validasi format nomor telepon Indonesia & internasional
- Auto-expire pairing code setelah 120 detik
- Event-driven architecture dengan EventEmitter
- Error handling yang comprehensive
- TypeScript types yang lengkap
- Unit tests 100% coverage

## Basic Usage

```typescript
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import { PairingHandler } from "./auth/pairing-handler";

async function connectWithPairingCode() {
  // 1. Setup auth state
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  // 2. Create socket dengan printQRInTerminal: false
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false, // WAJIB false untuk pairing code
  });

  // 3. Create pairing handler
  const pairingHandler = new PairingHandler();
  pairingHandler.setSocket(sock);

  // 4. Listen untuk pairing code events
  pairingHandler.on("pairing:code", ({ code, phoneNumber, expiresAt }) => {
    console.log(`Pairing code: ${code}`);
    console.log(`Untuk nomor: ${phoneNumber}`);
    console.log(`Expires: ${new Date(expiresAt)}`);
    // Kirim code ke frontend/user interface
  });

  pairingHandler.on("pairing:expired", ({ phoneNumber }) => {
    console.log(`Pairing code expired untuk ${phoneNumber}`);
  });

  pairingHandler.on("pairing:success", ({ jid }) => {
    console.log(`Pairing berhasil! JID: ${jid}`);
  });

  pairingHandler.on("pairing:error", ({ error, phoneNumber }) => {
    console.error(`Pairing error: ${error}`);
  });

  // 5. Request pairing code
  if (!sock.authState.creds.registered) {
    const result = await pairingHandler.requestPairingCode("6281234567890");
    if (result.success) {
      console.log("Silakan cek aplikasi WhatsApp untuk memasukkan code");
    }
  }

  return sock;
}
```

## Format Nomor Telepon

```typescript
// Valid
"6281234567890"        // Indonesia, format standar
"+62 812-3456-7890"    // Indonesia, dengan karakter khusus

// Invalid
"081234567890"         // Dimulai dengan 0 (tanpa country code)
"62812345"             // Terlalu pendek (< 10 digit)
```

## API Reference

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setSocket` | `sock: WASocket` | `void` | Set socket instance |
| `requestPairingCode` | `phoneNumber: string` | `Promise<PairingCodeResult>` | Request pairing code |
| `getCurrentCode` | - | `string \| null` | Get current active code |
| `getStatus` | - | `PairingStatus` | Get pairing status |
| `clearPairingCode` | - | `void` | Clear current code |
| `notifyPairingSuccess` | `jid: string` | `void` | Notify auth success |
| `isPairingCodeSupported` | - | `boolean` | Check Baileys support |
| `destroy` | - | `void` | Cleanup handler |

### Events

| Event | Data | Description |
|-------|------|-------------|
| `pairing:code` | `{ code, phoneNumber, expiresAt }` | Code generated |
| `pairing:expired` | `{ phoneNumber }` | Code expired |
| `pairing:success` | `{ jid }` | Auth success |
| `pairing:error` | `{ error, phoneNumber? }` | Error occurred |

## Limitasi

- Pairing code hanya berlaku untuk 1 device
- Setiap nomor telepon dibatasi berapa kali bisa request per hari
- Code hanya berlaku 60-120 detik
- Tidak semua versi Baileys mendukung pairing code

## File Location

`/baileys-service/src/auth/pairing-handler.ts`

## References

- [Baileys Documentation](https://github.com/whiskeysockets/baileys)
- [WhatsApp Multi-device FAQ](https://faq.whatsapp.com/1324084875126592/?cms_platform=web)