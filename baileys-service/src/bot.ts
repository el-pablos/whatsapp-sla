/**
 * WhatsApp SLA Bot - Real-time Database Integration
 *
 * Bot yang terintegrasi dengan Laravel API untuk:
 * - Query produk, harga, stok real-time
 * - Admin CRUD via WhatsApp
 * - Tracking chat & order
 */

import "dotenv/config";

import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  WASocket,
  proto,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import fs from "fs";
import path from "path";

// ==================== CONFIGURATION ====================
const SESSION_PATH = path.join(__dirname, "..", "sessions", "main");
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

// Laravel API Configuration
const LARAVEL_API_URL = process.env.LARAVEL_API_URL || "http://127.0.0.1:8000";
const BOT_SECRET =
  process.env.BOT_INTERNAL_SECRET || "sla-bot-internal-secret-2024";

// Admin phone numbers (can add/edit products)
const ADMIN_PHONES = (process.env.BOT_ADMIN_PHONES || "6281385427537").split(
  ",",
);

const logger = pino({ level: "warn" });

let retryCount = 0;
let currentSocket: WASocket | null = null;

// ==================== API HELPER ====================
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

interface Product {
  id: number;
  name: string;
  type: string;
  price: number;
  stock: number;
  unit: string;
  status: string;
}

interface Chat {
  id: number;
  whatsapp_chat_id: string;
  customer_phone: string;
  customer_name: string | null;
  status: string;
}

interface Order {
  id: number;
  customer_phone: string;
  customer_name: string;
  total: number;
  status: string;
}

async function apiCall<T>(
  endpoint: string,
  method: string = "GET",
  body?: any,
): Promise<ApiResponse<T>> {
  try {
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Bot-Secret": BOT_SECRET,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(
      `${LARAVEL_API_URL}/api/bot${endpoint}`,
      options,
    );
    return (await response.json()) as ApiResponse<T>;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    return { success: false, message: "API tidak tersedia" };
  }
}

// ==================== PRODUCT FUNCTIONS ====================
async function getProducts(): Promise<Product[]> {
  const result = await apiCall<Product[]>("/products");
  return result.success ? result.data || [] : [];
}

async function searchProduct(keyword: string): Promise<Product[]> {
  const result = await apiCall<Product[]>(
    `/products/search/${encodeURIComponent(keyword)}`,
  );
  return result.success ? result.data || [] : [];
}

async function updateStock(productId: number, stock: number): Promise<boolean> {
  const result = await apiCall(`/admin/products/${productId}/stock`, "PATCH", {
    stock,
  });
  return result.success;
}

async function updatePrice(productId: number, price: number): Promise<boolean> {
  const result = await apiCall(`/admin/products/${productId}`, "PUT", {
    price,
  });
  return result.success;
}

async function addProduct(
  data: Partial<Product>,
): Promise<ApiResponse<Product>> {
  return await apiCall<Product>("/admin/products", "POST", data);
}

// ==================== CHAT & ORDER TRACKING ====================

/**
 * Simpan/update chat ke database untuk SLA tracking
 */
async function trackChat(
  whatsappChatId: string,
  customerPhone: string,
  customerName: string | null,
): Promise<Chat | null> {
  const result = await apiCall<Chat>("/chats", "POST", {
    whatsapp_chat_id: whatsappChatId,
    customer_phone: customerPhone,
    customer_name: customerName,
    status: "active",
  });
  return result.success ? result.data || null : null;
}

/**
 * Simpan message ke database untuk history tracking
 */
async function trackMessage(
  chatId: number,
  waMessageId: string,
  direction: "in" | "out",
  content: string,
): Promise<boolean> {
  const result = await apiCall("/messages", "POST", {
    chat_id: chatId,
    wa_message_id: waMessageId,
    direction,
    content,
    type: "text",
  });
  return result.success;
}

/**
 * Simpan order ke database
 */
async function createOrder(
  product: Product,
  quantity: number,
  customerPhone: string,
  customerName: string,
): Promise<ApiResponse<Order>> {
  return await apiCall<Order>("/orders", "POST", {
    customer_phone: customerPhone,
    customer_name: customerName,
    items: [
      {
        name: product.name,
        product_id: product.id,
        quantity: quantity,
        price: product.price,
      },
    ],
    notes: `Order via WhatsApp Bot - ${new Date().toLocaleString("id-ID")}`,
  });
}

// ==================== FORMAT HELPERS ====================
function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(price);
}

function formatProductList(products: Product[]): string {
  if (products.length === 0) {
    return "❌ Tidak ada produk tersedia saat ini.";
  }

  let text = "📋 *DAFTAR PRODUK TERSEDIA*\n\n";

  products.forEach((p, i) => {
    const stockStatus =
      p.stock > 0 ? `✅ Stok: ${p.stock} ${p.unit}` : "❌ Stok Habis";
    text += `${i + 1}. *${p.name}*\n`;
    text += `   💰 ${formatPrice(p.price)}/${p.unit}\n`;
    text += `   ${stockStatus}\n\n`;
  });

  text += `\n📝 _Ketik "pesan [nama produk] [jumlah]" untuk order_`;
  return text;
}

function isAdmin(phone: string): boolean {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  return ADMIN_PHONES.some((adminPhone) =>
    cleanPhone.includes(adminPhone.replace(/[^0-9]/g, "")),
  );
}

// ==================== MESSAGE HANDLER ====================
async function handleMessage(socket: WASocket, message: proto.IWebMessageInfo) {
  try {
    const remoteJid = message.key.remoteJid;
    if (!remoteJid) return;

    // Skip grup dan status
    if (remoteJid.endsWith("@g.us") || remoteJid === "status@broadcast") return;
    if (message.key.fromMe) return;

    const messageContent = message.message;
    if (!messageContent) return;

    let text = "";
    if (messageContent.conversation) {
      text = messageContent.conversation;
    } else if (messageContent.extendedTextMessage?.text) {
      text = messageContent.extendedTextMessage.text;
    } else if (messageContent.imageMessage?.caption) {
      text = messageContent.imageMessage.caption;
    }

    if (!text) return;

    const lowerText = text.toLowerCase().trim();
    const senderName = message.pushName || "Customer";
    const senderPhone = remoteJid.replace("@s.whatsapp.net", "");
    const isAdminUser = isAdmin(senderPhone);

    console.log(
      `\n💬 [${isAdminUser ? "ADMIN" : "USER"}] ${senderName} (${senderPhone}):`,
    );
    console.log(`   "${text}"`);

    // Track chat ke database untuk SLA monitoring
    // Promise disimpan untuk tracking outgoing message di akhir
    const messageId = message.key.id || `${Date.now()}`;
    const chatTrackingPromise = trackChat(remoteJid, senderPhone, senderName)
      .then((chat) => {
        if (chat) {
          // Track incoming message
          trackMessage(chat.id, messageId, "in", text).catch((err) =>
            console.error("⚠️ Gagal track incoming message:", err),
          );
        }
        return chat;
      })
      .catch((err) => {
        console.error("⚠️ Gagal track chat:", err);
        return null;
      });

    let response = "";

    // ==================== ADMIN COMMANDS ====================
    if (isAdminUser) {
      // Update stok: /stok [nama produk] [jumlah]
      if (lowerText.startsWith("/stok ") || lowerText.startsWith("/stock ")) {
        const parts = text.split(" ").slice(1);
        const stockStr = parts.pop();
        const productName = parts.join(" ");
        const stock = parseInt(stockStr || "0");

        if (!productName || isNaN(stock)) {
          response =
            "❌ Format salah!\n\nGunakan: /stok [nama produk] [jumlah]\nContoh: /stok telur 100";
        } else {
          const products = await searchProduct(productName);
          if (products.length === 0) {
            response = `❌ Produk "${productName}" tidak ditemukan.`;
          } else {
            const success = await updateStock(products[0].id, stock);
            if (success) {
              response = `✅ *STOK DIUPDATE*\n\n📦 ${products[0].name}\n📊 Stok baru: ${stock} ${products[0].unit}`;
            } else {
              response = "❌ Gagal update stok. Coba lagi.";
            }
          }
        }
      }
      // Update harga: /harga [nama produk] [harga]
      else if (
        lowerText.startsWith("/harga ") ||
        lowerText.startsWith("/price ")
      ) {
        const parts = text.split(" ").slice(1);
        const priceStr = parts.pop();
        const productName = parts.join(" ");
        const price = parseInt(priceStr || "0");

        if (!productName || isNaN(price)) {
          response =
            "❌ Format salah!\n\nGunakan: /harga [nama produk] [harga]\nContoh: /harga telur 28000";
        } else {
          const products = await searchProduct(productName);
          if (products.length === 0) {
            response = `❌ Produk "${productName}" tidak ditemukan.`;
          } else {
            const success = await updatePrice(products[0].id, price);
            if (success) {
              response = `✅ *HARGA DIUPDATE*\n\n📦 ${products[0].name}\n💰 Harga baru: ${formatPrice(price)}/${products[0].unit}`;
            } else {
              response = "❌ Gagal update harga. Coba lagi.";
            }
          }
        }
      }
      // Tambah produk: /tambah [nama]|[type]|[harga]|[stok]|[unit]
      else if (
        lowerText.startsWith("/tambah ") ||
        lowerText.startsWith("/add ")
      ) {
        const dataStr = text.split(" ").slice(1).join(" ");
        const parts = dataStr.split("|").map((s) => s.trim());

        if (parts.length < 4) {
          response =
            "❌ Format salah!\n\nGunakan: /tambah [nama]|[type]|[harga]|[stok]|[unit]\nContoh: /tambah Telur Premium|telur|30000|50|kg";
        } else {
          const result = await addProduct({
            name: parts[0],
            type: parts[1] || "other",
            price: parseInt(parts[2]) || 0,
            stock: parseInt(parts[3]) || 0,
            unit: parts[4] || "pcs",
            status: "active",
          });

          if (result.success) {
            response = `✅ *PRODUK DITAMBAHKAN*\n\n📦 ${result.data?.name}\n💰 ${formatPrice(result.data?.price || 0)}/${result.data?.unit}\n📊 Stok: ${result.data?.stock}`;
          } else {
            response = `❌ Gagal tambah produk: ${result.message}`;
          }
        }
      }
      // Admin help
      else if (lowerText === "/admin" || lowerText === "/help admin") {
        response =
          `🔐 *ADMIN COMMANDS*\n\n` +
          `📊 *Update Stok:*\n/stok [produk] [jumlah]\n\n` +
          `💰 *Update Harga:*\n/harga [produk] [harga]\n\n` +
          `➕ *Tambah Produk:*\n/tambah [nama]|[type]|[harga]|[stok]|[unit]\n\n` +
          `📋 *Lihat Semua:*\nmenu\n\n` +
          `_Anda login sebagai Admin_`;
      }
    }

    // ==================== PUBLIC COMMANDS ====================
    if (!response) {
      // Menu / Katalog
      if (
        lowerText === "menu" ||
        lowerText === "katalog" ||
        lowerText === "daftar" ||
        lowerText === "produk"
      ) {
        const products = await getProducts();
        response = formatProductList(products);
      }
      // Cek harga spesifik
      else if (
        lowerText.startsWith("harga ") ||
        lowerText.startsWith("price ")
      ) {
        const keyword = text.split(" ").slice(1).join(" ");
        const products = await searchProduct(keyword);

        if (products.length === 0) {
          response = `❌ Produk "${keyword}" tidak ditemukan.\n\nKetik "menu" untuk lihat semua produk.`;
        } else {
          const p = products[0];
          response =
            `💰 *HARGA ${p.name.toUpperCase()}*\n\n` +
            `📦 ${p.name}\n` +
            `💵 ${formatPrice(p.price)}/${p.unit}\n` +
            `📊 Stok: ${p.stock > 0 ? `${p.stock} ${p.unit}` : "HABIS"}\n\n` +
            `_Ketik "pesan ${p.name} [jumlah]" untuk order_`;
        }
      }
      // Cek stok
      else if (
        lowerText.startsWith("stok ") ||
        lowerText.startsWith("stock ")
      ) {
        const keyword = text.split(" ").slice(1).join(" ");
        const products = await searchProduct(keyword);

        if (products.length === 0) {
          response = `❌ Produk "${keyword}" tidak ditemukan.`;
        } else {
          const p = products[0];
          const stockStatus =
            p.stock > 0 ? `✅ TERSEDIA: ${p.stock} ${p.unit}` : "❌ STOK HABIS";
          response = `📦 *STOK ${p.name.toUpperCase()}*\n\n${stockStatus}\n💰 Harga: ${formatPrice(p.price)}/${p.unit}`;
        }
      }
      // Order / Pesan
      else if (
        lowerText.startsWith("pesan ") ||
        lowerText.startsWith("order ") ||
        lowerText.startsWith("beli ")
      ) {
        const orderText = text.substring(text.indexOf(" ") + 1);
        // Parse: "telur 5 kg" atau "telur 5"
        const parts = orderText.trim().split(/\s+/);
        let productName = "";
        let quantity = 1;

        // Try to extract quantity
        for (let i = parts.length - 1; i >= 0; i--) {
          const num = parseInt(parts[i]);
          if (!isNaN(num)) {
            quantity = num;
            productName = parts.slice(0, i).join(" ");
            break;
          }
        }

        if (!productName) {
          productName = orderText;
        }

        const products = await searchProduct(productName);

        if (products.length === 0) {
          response = `❌ Produk "${productName}" tidak ditemukan.\n\nKetik "menu" untuk lihat produk tersedia.`;
        } else {
          const p = products[0];
          if (p.stock < quantity) {
            response = `❌ Stok tidak cukup!\n\n📦 ${p.name}\n📊 Stok tersedia: ${p.stock} ${p.unit}\n📝 Anda minta: ${quantity} ${p.unit}`;
          } else {
            const total = p.price * quantity;

            // Simpan order ke database
            const orderResult = await createOrder(
              p,
              quantity,
              senderPhone,
              senderName,
            );

            if (orderResult.success && orderResult.data) {
              response =
                `✅ *PESANAN DITERIMA*\n\n` +
                `🔢 Order ID: #${orderResult.data.id}\n` +
                `📦 Produk: ${p.name}\n` +
                `📊 Jumlah: ${quantity} ${p.unit}\n` +
                `💰 Harga: ${formatPrice(p.price)}/${p.unit}\n` +
                `💵 *TOTAL: ${formatPrice(total)}*\n\n` +
                `👤 Nama: ${senderName}\n` +
                `📱 Phone: ${senderPhone}\n\n` +
                `⏳ Admin akan menghubungi untuk konfirmasi.\n` +
                `_Terima kasih sudah berbelanja!_ 🙏`;
            } else {
              // Fallback jika gagal simpan ke database, tetap kirim konfirmasi
              console.error("⚠️ Gagal simpan order:", orderResult.message);
              response =
                `✅ *PESANAN DITERIMA*\n\n` +
                `📦 Produk: ${p.name}\n` +
                `📊 Jumlah: ${quantity} ${p.unit}\n` +
                `💰 Harga: ${formatPrice(p.price)}/${p.unit}\n` +
                `💵 *TOTAL: ${formatPrice(total)}*\n\n` +
                `👤 Nama: ${senderName}\n` +
                `📱 Phone: ${senderPhone}\n\n` +
                `⏳ Admin akan menghubungi untuk konfirmasi.\n` +
                `_Terima kasih sudah berbelanja!_ 🙏`;
            }
          }
        }
      }
      // Help
      else if (
        lowerText === "help" ||
        lowerText === "bantuan" ||
        lowerText === "?"
      ) {
        response =
          `❓ *PANDUAN PENGGUNAAN*\n\n` +
          `📋 *menu* - Lihat daftar produk\n` +
          `💰 *harga [produk]* - Cek harga\n` +
          `📦 *stok [produk]* - Cek ketersediaan\n` +
          `🛒 *pesan [produk] [jumlah]* - Buat pesanan\n` +
          `👤 *admin* - Hubungi CS\n\n` +
          `_Contoh: "pesan telur 5 kg"_`;
      }
      // Greeting
      else if (
        ["halo", "hai", "hi", "hello", "p", "hallo"].includes(lowerText)
      ) {
        response = `👋 Halo ${senderName}!\n\nSelamat datang di *Toko Ayam SLA*! 🐔\n\nKetik "menu" untuk lihat produk kami.`;
      }
      // Admin request
      else if (
        lowerText === "admin" ||
        lowerText === "cs" ||
        lowerText === "operator"
      ) {
        response = `👋 Halo ${senderName}!\n\nPermintaan Anda untuk berbicara dengan admin sudah diterima.\n\n⏰ Admin akan menghubungi dalam 5-10 menit.`;
      }
      // Default
      else {
        response = `Halo ${senderName}! 👋\n\nMaaf, saya tidak mengerti.\n\nKetik:\n• "menu" - lihat produk\n• "help" - panduan\n• "admin" - hubungi CS`;
      }
    }

    // Send response
    if (response) {
      console.log(`📤 Membalas...`);
      const sentMessage = await socket.sendMessage(remoteJid, {
        text: response,
      });
      console.log(`✅ Terkirim!`);

      // Track outgoing message - await chat tracking promise untuk mendapatkan chat id
      if (sentMessage?.key?.id) {
        chatTrackingPromise
          .then((chat) => {
            if (chat) {
              trackMessage(chat.id, sentMessage.key.id!, "out", response).catch(
                (err) => console.error("⚠️ Gagal track outgoing message:", err),
              );
            }
          })
          .catch(() => {}); // Sudah di-handle di promise atas
      }
    }
  } catch (err) {
    console.error("❌ Error handling message:", err);
  }
}

// ==================== CONNECTION LOGIC ====================
function clearSession(): void {
  if (fs.existsSync(SESSION_PATH)) {
    console.log("🗑️  Clearing session...");
    fs.rmSync(SESSION_PATH, { recursive: true, force: true });
  }
  fs.mkdirSync(SESSION_PATH, { recursive: true });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startBot(clearFirst: boolean = false): Promise<void> {
  if (clearFirst) {
    clearSession();
  } else if (!fs.existsSync(SESSION_PATH)) {
    fs.mkdirSync(SESSION_PATH, { recursive: true });
  }

  console.log(
    `\n🤖 Starting WhatsApp SLA Bot (attempt ${retryCount + 1}/${MAX_RETRIES})...\n`,
  );

  try {
    const { version } = await fetchLatestBaileysVersion();
    console.log(`📡 Baileys: ${version.join(".")}`);
    console.log(`🌐 Laravel API: ${LARAVEL_API_URL}`);
    console.log(`👑 Admin phones: ${ADMIN_PHONES.join(", ")}`);

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
    console.log(`🔑 Session: ${state.creds.me?.id || "not authenticated"}`);

    const socket = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      logger,
      printQRInTerminal: false,
      browser: ["WhatsApp SLA Bot", "Chrome", "1.0.0"],
      connectTimeoutMs: 60000,
      retryRequestDelayMs: 2000,
    });

    currentSocket = socket;
    socket.ev.on("creds.update", saveCreds);

    // Message handler
    socket.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;
      for (const msg of messages) {
        await handleMessage(socket, msg);
      }
    });

    // Connection handler
    socket.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log("\n⚠️  Perlu autentikasi! Jalankan quick-qr.ts dulu.\n");
      }

      if (connection === "open") {
        retryCount = 0;
        console.log("\n" + "═".repeat(50));
        console.log("✅ BOT ONLINE - Real-time Database Mode");
        console.log(`   JID: ${socket.user?.id}`);
        console.log("═".repeat(50) + "\n");

        // Test API connection
        const products = await getProducts();
        console.log(`📊 Database: ${products.length} produk tersedia\n`);
      }

      if (connection === "close") {
        const error = lastDisconnect?.error as Boom;
        const statusCode = error?.output?.statusCode;

        console.log(`\n📴 Disconnected (code: ${statusCode})`);

        if (statusCode === DisconnectReason.loggedOut) {
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            await sleep(RETRY_DELAY_MS);
            await startBot(true);
          }
        } else if (statusCode === DisconnectReason.restartRequired) {
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            await sleep(RETRY_DELAY_MS * 2);
            await startBot(false);
          }
        } else if (statusCode === DisconnectReason.connectionReplaced) {
          process.exit(0);
        } else if (retryCount < MAX_RETRIES) {
          retryCount++;
          await sleep(RETRY_DELAY_MS);
          await startBot(false);
        }
      }
    });
  } catch (err) {
    console.error("\n❌ Error:", err);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      await sleep(RETRY_DELAY_MS);
      await startBot(true);
    } else {
      process.exit(1);
    }
  }
}

// ==================== MAIN ====================
async function main() {
  console.log("\n" + "═".repeat(50));
  console.log("🤖 WhatsApp SLA Bot - Real-time Database");
  console.log("═".repeat(50));

  process.on("SIGINT", async () => {
    console.log("\n\n👋 Shutting down...");
    if (currentSocket) currentSocket.end(undefined);
    process.exit(0);
  });

  const sessionExists = fs.existsSync(path.join(SESSION_PATH, "creds.json"));
  if (!sessionExists) {
    console.log("\n⚠️  Session tidak ditemukan!");
    console.log("   Jalankan quick-qr.ts atau quick-pair.ts dulu.\n");
    process.exit(1);
  }

  await startBot(false);
}

main().catch(console.error);
