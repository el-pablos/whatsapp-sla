"""
WhatsApp Bot Handlers - Menu System untuk Ayam Petelur
"""
import os
import json
import requests
from typing import Optional, Dict, Any
from datetime import datetime

# Session storage (in-memory, gunakan Redis di production)
sessions: Dict[str, Dict[str, Any]] = {}

# Config dari environment
LARAVEL_API_URL = os.getenv("API_URL", os.getenv("APP_URL", "http://localhost") + "/api")
API_BOT_TOKEN = os.getenv("API_BOT_TOKEN", "")
WA_API_URL = os.getenv("WA_API_URL", "https://graph.facebook.com/v18.0")
WA_PHONE_NUMBER_ID = os.getenv("WA_PHONE_NUMBER_ID", "")
WA_ACCESS_TOKEN = os.getenv("WA_ACCESS_TOKEN", "")


def get_session(phone: str) -> Dict[str, Any]:
    """Ambil atau buat session baru untuk user"""
    if phone not in sessions:
        sessions[phone] = {
            "state": "main_menu",
            "context": {},
            "last_activity": datetime.now().isoformat(),
            "order_data": {}
        }
    sessions[phone]["last_activity"] = datetime.now().isoformat()
    return sessions[phone]


def set_state(phone: str, state: str, context: Optional[Dict] = None) -> None:
    """Update state conversation user"""
    session = get_session(phone)
    session["state"] = state
    if context:
        session["context"].update(context)


def clear_session(phone: str) -> None:
    """Reset session user ke awal"""
    if phone in sessions:
        del sessions[phone]


def send_whatsapp_message(phone: str, message: str) -> Dict:
    """Kirim pesan teks ke WhatsApp"""
    url = f"{WA_API_URL}/{WA_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WA_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": message}
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        return response.json()
    except requests.RequestException as e:
        return {"error": str(e)}


def send_whatsapp_buttons(phone: str, body: str, buttons: list) -> Dict:
    """Kirim pesan dengan interactive buttons"""
    url = f"{WA_API_URL}/{WA_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WA_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }

    button_list = []
    for i, btn in enumerate(buttons[:3]):  # Max 3 buttons
        button_list.append({
            "type": "reply",
            "reply": {
                "id": btn.get("id", f"btn_{i}"),
                "title": btn.get("title", "Button")[:20]  # Max 20 chars
            }
        })

    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {"text": body},
            "action": {"buttons": button_list}
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        return response.json()
    except requests.RequestException as e:
        return {"error": str(e)}


def send_whatsapp_list(phone: str, body: str, button_text: str, sections: list) -> Dict:
    """Kirim pesan dengan interactive list"""
    url = f"{WA_API_URL}/{WA_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WA_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "interactive",
        "interactive": {
            "type": "list",
            "body": {"text": body},
            "action": {
                "button": button_text,
                "sections": sections
            }
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        return response.json()
    except requests.RequestException as e:
        return {"error": str(e)}


def call_laravel_api(endpoint: str, method: str = "GET", data: Optional[Dict] = None) -> Dict:
    """Call Laravel API untuk ambil data"""
    url = f"{LARAVEL_API_URL}/{endpoint}"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {API_BOT_TOKEN}"
    }

    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=30)
        else:
            response = requests.post(url, headers=headers, json=data or {}, timeout=30)
        return response.json()
    except requests.RequestException as e:
        return {"error": str(e), "success": False}


def handle_message(phone: str, message: str) -> None:
    """Main router - handle incoming message"""
    session = get_session(phone)
    state = session["state"]
    msg_lower = message.lower().strip()

    # Global commands
    if msg_lower in ["menu", "home", "start", "mulai", "hi", "halo"]:
        clear_session(phone)
        show_main_menu(phone)
        return

    if msg_lower in ["batal", "cancel", "keluar"]:
        clear_session(phone)
        send_whatsapp_message(phone, "Dibatalkan. Ketik 'menu' untuk kembali ke menu utama.")
        return

    # Route berdasarkan state
    state_handlers = {
        "main_menu": handle_main_menu_input,
        "waiting_order_product": handle_order_product_input,
        "waiting_order_quantity": handle_order_quantity_input,
        "waiting_order_address": handle_order_address_input,
        "waiting_order_confirm": handle_order_confirm_input,
    }

    handler = state_handlers.get(state, handle_main_menu_input)
    handler(phone, message)


def show_main_menu(phone: str) -> None:
    """Tampilkan menu utama dengan buttons"""
    set_state(phone, "main_menu")

    welcome_text = (
        "Selamat datang di *Ayam Petelur Farm*\n\n"
        "Kami menyediakan telur segar dan ayam berkualitas.\n\n"
        "Silakan pilih menu:"
    )

    # Gunakan list untuk lebih dari 3 menu
    sections = [
        {
            "title": "Menu Utama",
            "rows": [
                {"id": "price", "title": "Lihat Harga", "description": "Cek harga telur & ayam"},
                {"id": "stock", "title": "Cek Stok", "description": "Lihat ketersediaan produk"},
                {"id": "order", "title": "Pesan Produk", "description": "Buat pesanan baru"},
                {"id": "catalog", "title": "Katalog", "description": "Lihat katalog lengkap"},
                {"id": "admin", "title": "Hubungi Admin", "description": "Chat dengan admin kami"}
            ]
        }
    ]

    send_whatsapp_list(phone, welcome_text, "Pilih Menu", sections)


def handle_main_menu_input(phone: str, message: str) -> None:
    """Handle input dari main menu"""
    msg_lower = message.lower().strip()

    menu_map = {
        "price": handle_price,
        "lihat harga": handle_price,
        "harga": handle_price,
        "1": handle_price,

        "stock": handle_stock,
        "cek stok": handle_stock,
        "stok": handle_stock,
        "2": handle_stock,

        "order": lambda p: handle_order(p, {}),
        "pesan produk": lambda p: handle_order(p, {}),
        "pesan": lambda p: handle_order(p, {}),
        "3": lambda p: handle_order(p, {}),

        "catalog": handle_catalog,
        "katalog": handle_catalog,
        "4": handle_catalog,

        "admin": handle_admin,
        "hubungi admin": handle_admin,
        "5": handle_admin,
    }

    handler = menu_map.get(msg_lower)
    if handler:
        handler(phone)
    else:
        send_whatsapp_message(
            phone,
            "Maaf, pilihan tidak dikenali.\n\nKetik 'menu' untuk melihat pilihan yang tersedia."
        )


def handle_price(phone: str) -> None:
    """Tampilkan daftar harga telur & ayam"""
    # Ambil data dari Laravel API
    api_response = call_laravel_api("products/prices")

    if api_response.get("success") and api_response.get("data"):
        products = api_response["data"]
        price_text = "*DAFTAR HARGA*\n"
        price_text += "=" * 20 + "\n\n"

        for product in products:
            name = product.get("name", "Produk")
            price = product.get("price", 0)
            unit = product.get("unit", "kg")
            price_text += f"*{name}*\n"
            price_text += f"Rp {price:,.0f}/{unit}\n\n"
    else:
        # Fallback jika API error
        price_text = (
            "*DAFTAR HARGA*\n"
            "=" * 20 + "\n\n"
            "*Telur Ayam Segar*\n"
            "Rp 28.000/kg\n\n"
            "*Telur Ayam Omega*\n"
            "Rp 35.000/kg\n\n"
            "*Ayam Potong Segar*\n"
            "Rp 38.000/kg\n\n"
            "*Ayam Kampung*\n"
            "Rp 85.000/ekor\n\n"
        )

    price_text += "_Harga dapat berubah sewaktu-waktu_\n"
    price_text += "_Update: " + datetime.now().strftime("%d/%m/%Y") + "_"

    send_whatsapp_message(phone, price_text)

    # Tampilkan quick action buttons
    send_whatsapp_buttons(
        phone,
        "Mau langsung pesan?",
        [
            {"id": "order", "title": "Pesan Sekarang"},
            {"id": "stock", "title": "Cek Stok"},
            {"id": "menu_back", "title": "Menu Utama"}
        ]
    )
    set_state(phone, "main_menu")


def handle_stock(phone: str) -> None:
    """Tampilkan stok tersedia"""
    # Ambil data dari Laravel API
    api_response = call_laravel_api("products/stock")

    if api_response.get("success") and api_response.get("data"):
        products = api_response["data"]
        stock_text = "*KETERSEDIAAN STOK*\n"
        stock_text += "=" * 20 + "\n\n"

        for product in products:
            name = product.get("name", "Produk")
            stock = product.get("stock", 0)
            unit = product.get("unit", "kg")
            status = "Tersedia" if stock > 0 else "Habis"
            emoji_status = "v" if stock > 0 else "x"
            stock_text += f"[{emoji_status}] *{name}*\n"
            stock_text += f"    Stok: {stock:,.0f} {unit} - {status}\n\n"
    else:
        # Fallback jika API error
        stock_text = (
            "*KETERSEDIAAN STOK*\n"
            "=" * 20 + "\n\n"
            "[v] *Telur Ayam Segar*\n"
            "    Stok: 500 kg - Tersedia\n\n"
            "[v] *Telur Ayam Omega*\n"
            "    Stok: 200 kg - Tersedia\n\n"
            "[v] *Ayam Potong Segar*\n"
            "    Stok: 150 kg - Tersedia\n\n"
            "[x] *Ayam Kampung*\n"
            "    Stok: 0 ekor - Habis\n\n"
        )

    stock_text += "_Update: " + datetime.now().strftime("%d/%m/%Y %H:%M") + "_"

    send_whatsapp_message(phone, stock_text)

    send_whatsapp_buttons(
        phone,
        "Pilih aksi:",
        [
            {"id": "order", "title": "Pesan Produk"},
            {"id": "price", "title": "Lihat Harga"},
            {"id": "menu_back", "title": "Menu Utama"}
        ]
    )
    set_state(phone, "main_menu")


def handle_order(phone: str, context: Dict) -> None:
    """Flow pemesanan produk"""
    session = get_session(phone)
    session["order_data"] = {}

    # Ambil daftar produk dari API
    api_response = call_laravel_api("products")

    if api_response.get("success") and api_response.get("data"):
        products = api_response["data"]
        rows = []
        for product in products:
            if product.get("stock", 0) > 0:
                rows.append({
                    "id": f"product_{product.get('id')}",
                    "title": product.get("name", "Produk")[:24],
                    "description": f"Rp {product.get('price', 0):,.0f}/{product.get('unit', 'kg')}"
                })
    else:
        # Fallback
        rows = [
            {"id": "product_1", "title": "Telur Ayam Segar", "description": "Rp 28.000/kg"},
            {"id": "product_2", "title": "Telur Ayam Omega", "description": "Rp 35.000/kg"},
            {"id": "product_3", "title": "Ayam Potong Segar", "description": "Rp 38.000/kg"},
        ]

    sections = [{"title": "Pilih Produk", "rows": rows}]

    send_whatsapp_list(
        phone,
        "Silakan pilih produk yang ingin dipesan:",
        "Pilih Produk",
        sections
    )
    set_state(phone, "waiting_order_product")


def handle_order_product_input(phone: str, message: str) -> None:
    """Handle pilihan produk untuk order"""
    session = get_session(phone)

    # Parse product selection
    if message.startswith("product_"):
        product_id = message.replace("product_", "")
    else:
        # Coba match nama produk
        product_map = {
            "telur ayam segar": "1",
            "telur segar": "1",
            "telur omega": "2",
            "telur ayam omega": "2",
            "ayam potong": "3",
            "ayam potong segar": "3",
        }
        product_id = product_map.get(message.lower().strip(), message)

    session["order_data"]["product_id"] = product_id
    session["order_data"]["product_name"] = message  # Simpan nama asli

    send_whatsapp_message(
        phone,
        f"Produk: *{message}*\n\nBerapa jumlah yang ingin dipesan?\n(contoh: 10 kg atau 5 ekor)"
    )
    set_state(phone, "waiting_order_quantity")


def handle_order_quantity_input(phone: str, message: str) -> None:
    """Handle input jumlah pesanan"""
    session = get_session(phone)

    # Parse quantity
    try:
        # Ekstrak angka dari pesan
        import re
        numbers = re.findall(r'\d+', message)
        if numbers:
            quantity = int(numbers[0])
        else:
            raise ValueError("No number found")

        if quantity <= 0:
            raise ValueError("Invalid quantity")

    except (ValueError, IndexError):
        send_whatsapp_message(
            phone,
            "Mohon masukkan jumlah yang valid.\n(contoh: 10 kg atau 5 ekor)"
        )
        return

    session["order_data"]["quantity"] = quantity
    session["order_data"]["quantity_text"] = message

    send_whatsapp_message(
        phone,
        f"Jumlah: *{message}*\n\nMohon kirimkan alamat pengiriman lengkap:"
    )
    set_state(phone, "waiting_order_address")


def handle_order_address_input(phone: str, message: str) -> None:
    """Handle input alamat pengiriman"""
    session = get_session(phone)

    if len(message.strip()) < 10:
        send_whatsapp_message(
            phone,
            "Mohon masukkan alamat yang lengkap (minimal 10 karakter)."
        )
        return

    session["order_data"]["address"] = message.strip()

    # Tampilkan ringkasan pesanan
    order = session["order_data"]
    summary = (
        "*KONFIRMASI PESANAN*\n"
        "=" * 20 + "\n\n"
        f"Produk: {order.get('product_name', '-')}\n"
        f"Jumlah: {order.get('quantity_text', '-')}\n"
        f"Alamat: {order.get('address', '-')}\n\n"
        "Apakah data sudah benar?"
    )

    send_whatsapp_buttons(
        phone,
        summary,
        [
            {"id": "confirm_yes", "title": "Ya, Pesan"},
            {"id": "confirm_no", "title": "Ubah Pesanan"},
            {"id": "confirm_cancel", "title": "Batalkan"}
        ]
    )
    set_state(phone, "waiting_order_confirm")


def handle_order_confirm_input(phone: str, message: str) -> None:
    """Handle konfirmasi pesanan"""
    session = get_session(phone)
    msg_lower = message.lower().strip()

    if msg_lower in ["confirm_yes", "ya", "yes", "ok", "ya, pesan"]:
        # Submit order ke Laravel API
        order_data = session["order_data"]
        api_response = call_laravel_api("orders", "POST", {
            "product_id": order_data.get("product_id"),
            "quantity": order_data.get("quantity"),
            "address": order_data.get("address"),
            "customer_phone": phone
        })

        if api_response.get("success"):
            order_id = api_response.get("data", {}).get("order_id", "N/A")
            send_whatsapp_message(
                phone,
                f"*Pesanan Berhasil!*\n\n"
                f"No. Pesanan: #{order_id}\n\n"
                f"Tim kami akan segera menghubungi Anda untuk konfirmasi pembayaran.\n\n"
                f"Terima kasih telah berbelanja di Ayam Petelur Farm!"
            )
        else:
            send_whatsapp_message(
                phone,
                "*Pesanan Tercatat*\n\n"
                "Pesanan Anda sedang diproses. "
                "Admin kami akan menghubungi Anda segera.\n\n"
                "Terima kasih!"
            )

        clear_session(phone)

    elif msg_lower in ["confirm_no", "ubah", "ubah pesanan"]:
        send_whatsapp_message(phone, "Pesanan dibatalkan. Mari mulai dari awal.")
        handle_order(phone, {})

    elif msg_lower in ["confirm_cancel", "batal", "batalkan"]:
        clear_session(phone)
        send_whatsapp_message(phone, "Pesanan dibatalkan.\n\nKetik 'menu' untuk kembali ke menu utama.")

    else:
        send_whatsapp_buttons(
            phone,
            "Pilih salah satu:",
            [
                {"id": "confirm_yes", "title": "Ya, Pesan"},
                {"id": "confirm_no", "title": "Ubah Pesanan"},
                {"id": "confirm_cancel", "title": "Batalkan"}
            ]
        )


def handle_catalog(phone: str) -> None:
    """Kirim katalog produk"""
    # Ambil katalog dari API
    api_response = call_laravel_api("catalog")

    catalog_text = (
        "*KATALOG PRODUK*\n"
        "*Ayam Petelur Farm*\n"
        "=" * 20 + "\n\n"
        "*TELUR AYAM*\n"
        "Telur segar dari peternakan kami, dipanen setiap hari.\n\n"
        "1. Telur Ayam Segar (Grade A)\n"
        "   - Berat rata-rata: 60-65 gram/butir\n"
        "   - Kemasan: Tray 30 butir\n\n"
        "2. Telur Ayam Omega\n"
        "   - Diperkaya Omega-3 & DHA\n"
        "   - Kemasan: Box 10 butir\n\n"
        "*AYAM SEGAR*\n"
        "Ayam potong segar, tanpa pengawet.\n\n"
        "3. Ayam Potong Segar\n"
        "   - Berat: 1.2-1.5 kg/ekor\n"
        "   - Tersedia: Utuh/Potong\n\n"
        "4. Ayam Kampung\n"
        "   - Berat: 0.8-1.2 kg/ekor\n"
        "   - Free range\n\n"
        "_Semua produk HALAL & tersertifikasi_"
    )

    send_whatsapp_message(phone, catalog_text)

    # Kirim gambar katalog jika ada URL
    if api_response.get("success") and api_response.get("data", {}).get("image_url"):
        send_catalog_image(phone, api_response["data"]["image_url"])

    send_whatsapp_buttons(
        phone,
        "Tertarik untuk memesan?",
        [
            {"id": "order", "title": "Pesan Sekarang"},
            {"id": "price", "title": "Lihat Harga"},
            {"id": "menu_back", "title": "Menu Utama"}
        ]
    )
    set_state(phone, "main_menu")


def send_catalog_image(phone: str, image_url: str) -> Dict:
    """Kirim gambar katalog"""
    url = f"{WA_API_URL}/{WA_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WA_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "image",
        "image": {
            "link": image_url,
            "caption": "Katalog Produk Ayam Petelur Farm"
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        return response.json()
    except requests.RequestException as e:
        return {"error": str(e)}


def handle_admin(phone: str) -> None:
    """Forward ke admin / tunjukkan kontak admin"""
    admin_text = (
        "*HUBUNGI ADMIN*\n"
        "=" * 20 + "\n\n"
        "Silakan hubungi admin kami untuk:\n"
        "- Pertanyaan lebih lanjut\n"
        "- Komplain & saran\n"
        "- Pesanan dalam jumlah besar\n"
        "- Kerjasama bisnis\n\n"
        "*Kontak Admin:*\n"
        "WhatsApp: 0812-XXXX-XXXX\n"
        "Email: admin@ayampetelur.com\n\n"
        "*Jam Operasional:*\n"
        "Senin - Sabtu: 07:00 - 17:00 WIB\n"
        "Minggu: Libur\n\n"
        "_Pesan Anda telah diteruskan ke admin._"
    )

    send_whatsapp_message(phone, admin_text)

    # Notify admin via API
    call_laravel_api("admin/notify", "POST", {
        "customer_phone": phone,
        "type": "contact_request",
        "message": "Customer meminta bantuan admin"
    })

    send_whatsapp_buttons(
        phone,
        "Ada yang bisa dibantu lagi?",
        [
            {"id": "order", "title": "Pesan Produk"},
            {"id": "catalog", "title": "Lihat Katalog"},
            {"id": "menu_back", "title": "Menu Utama"}
        ]
    )
    set_state(phone, "main_menu")


# Untuk testing
if __name__ == "__main__":
    # Simulate conversation
    test_phone = "6281234567890"

    print("=== Testing Bot Handlers ===\n")

    # Test main menu
    print("1. Show main menu")
    show_main_menu(test_phone)

    # Test price
    print("\n2. Handle price request")
    handle_message(test_phone, "harga")

    # Test stock
    print("\n3. Handle stock request")
    handle_message(test_phone, "stok")

    # Test order flow
    print("\n4. Test order flow")
    handle_message(test_phone, "pesan")

    print("\n=== Tests completed ===")


def handle_status_update(status: Dict[str, Any]) -> None:
    """
    Handle status update dari WhatsApp (delivered, read, dll)

    Args:
        status: Status update dari webhook
    """
    status_id = status.get("id", "")
    recipient_id = status.get("recipient_id", "")
    status_type = status.get("status", "")
    timestamp = status.get("timestamp", "")

    # Log status update
    print(f"[STATUS] Message {status_id} to {recipient_id}: {status_type} at {timestamp}")

    # Bisa di-extend untuk:
    # - Update database status pesan
    # - Kirim notifikasi ke admin
    # - Analytics

    # Contoh: Update status di Laravel
    if status_type in ["delivered", "read", "failed"]:
        call_laravel_api("messages/status", "POST", {
            "message_id": status_id,
            "status": status_type,
            "timestamp": timestamp
        })
