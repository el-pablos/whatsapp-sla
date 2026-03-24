<p align="center">
  <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp"/>
  <img src="https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel"/>
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis"/>
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL"/>
</p>

<h1 align="center">WhatsApp SLA Chatbot</h1>
<h3 align="center">Sistem Otomasi Layanan Pelanggan untuk Bisnis Ayam Petelur</h3>

<p align="center">
  <img src="https://img.shields.io/github/license/el-pablos/whatsapp-sla?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/github/stars/el-pablos/whatsapp-sla?style=flat-square" alt="Stars"/>
  <img src="https://img.shields.io/github/forks/el-pablos/whatsapp-sla?style=flat-square" alt="Forks"/>
  <img src="https://img.shields.io/github/issues/el-pablos/whatsapp-sla?style=flat-square" alt="Issues"/>
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome"/>
</p>

<p align="center">
  <a href="#tentang-proyek">Tentang</a> •
  <a href="#fitur-utama">Fitur</a> •
  <a href="#arsitektur">Arsitektur</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#instalasi">Instalasi</a> •
  <a href="#api-documentation">API</a> •
  <a href="#kontributor">Kontributor</a>
</p>

---

## Tentang Proyek

**WhatsApp SLA** adalah sistem chatbot otomatis yang dirancang khusus untuk bisnis peternakan ayam petelur. Sistem ini mengintegrasikan WhatsApp Business API untuk menangani:

- Pemesanan produk (telur & ayam) via chat
- Informasi harga real-time
- Katalog produk interaktif
- Notifikasi status pesanan
- Layanan pelanggan 24/7

Dibangun dengan arsitektur modern yang memisahkan backend API (Laravel) dan bot handler (Python), sistem ini menjamin skalabilitas dan kemudahan maintenance.

---

## Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Auto-Reply Bot** | Respon otomatis untuk pertanyaan umum pelanggan |
| **Order Management** | Kelola pesanan dari penerimaan hingga pengiriman |
| **Product Catalog** | Katalog digital telur dan ayam dengan harga dinamis |
| **Price History** | Tracking perubahan harga untuk analisis bisnis |
| **Dashboard Analytics** | Visualisasi data penjualan dan chat metrics |
| **Multi-User Support** | Role-based access untuk admin dan operator |
| **SLA Monitoring** | Pantau response time dan service level |

---

## Arsitektur

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              WHATSAPP SLA SYSTEM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐       │
│   │   Customer   │◄───────►│   WhatsApp   │◄───────►│   Meta API   │       │
│   │  (WhatsApp)  │         │   Business   │         │   Gateway    │       │
│   └──────────────┘         └──────────────┘         └──────┬───────┘       │
│                                                            │               │
│   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─   │
│                                                            ▼               │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                        APPLICATION LAYER                            │  │
│   │                                                                     │  │
│   │   ┌─────────────────────┐       ┌─────────────────────┐            │  │
│   │   │   LARAVEL BACKEND   │       │   PYTHON BOT        │            │  │
│   │   │   ─────────────────  │       │   ─────────────────  │            │  │
│   │   │   • REST API        │◄─────►│   • Message Handler │            │  │
│   │   │   • Web Dashboard   │       │   • Auto Reply      │            │  │
│   │   │   • Auth & RBAC     │       │   • Notification    │            │  │
│   │   │   • Order Process   │       │   • WA API Client   │            │  │
│   │   └──────────┬──────────┘       └──────────┬──────────┘            │  │
│   │              │                             │                        │  │
│   └──────────────┼─────────────────────────────┼────────────────────────┘  │
│                  │                             │                           │
│   ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                  │                             │                           │
│   ┌──────────────┼─────────────────────────────┼────────────────────────┐  │
│   │              ▼          DATA LAYER         ▼                        │  │
│   │                                                                     │  │
│   │   ┌─────────────────────┐       ┌─────────────────────┐            │  │
│   │   │       MySQL         │       │       Redis         │            │  │
│   │   │   ─────────────────  │       │   ─────────────────  │            │  │
│   │   │   • Users           │       │   • Session Cache   │            │  │
│   │   │   • Products        │       │   • Queue Jobs      │            │  │
│   │   │   • Orders          │       │   • Rate Limiting   │            │  │
│   │   │   • Chats           │       │   • Real-time Data  │            │  │
│   │   └─────────────────────┘       └─────────────────────┘            │  │
│   │                                                                     │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    users ||--o{ orders : "creates"
    users ||--o{ chats : "handles"
    products ||--o{ order_items : "contains"
    orders ||--|{ order_items : "has"
    products ||--o{ price_histories : "tracks"
    products ||--o{ catalogs : "listed_in"
    chats ||--|{ messages : "contains"
    customers ||--o{ orders : "places"
    customers ||--o{ chats : "initiates"

    users {
        uuid id PK
        string name
        string email UK
        string password
        enum role "admin,operator"
        timestamp created_at
    }

    customers {
        uuid id PK
        string phone_number UK
        string name
        string address
        timestamp last_interaction
        timestamp created_at
    }

    products {
        uuid id PK
        string name
        string sku UK
        enum type "telur,ayam"
        text description
        decimal price
        int stock
        boolean is_active
        timestamp created_at
    }

    orders {
        uuid id PK
        uuid customer_id FK
        uuid user_id FK
        string order_number UK
        decimal total_amount
        enum status "pending,confirmed,processing,shipped,delivered,cancelled"
        text notes
        timestamp ordered_at
    }

    order_items {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        decimal unit_price
        decimal subtotal
    }

    chats {
        uuid id PK
        uuid customer_id FK
        uuid user_id FK
        enum status "open,assigned,resolved"
        timestamp started_at
        timestamp resolved_at
    }

    messages {
        uuid id PK
        uuid chat_id FK
        enum direction "incoming,outgoing"
        text content
        enum type "text,image,document"
        string wa_message_id
        timestamp sent_at
    }

    catalogs {
        uuid id PK
        uuid product_id FK
        string image_url
        boolean is_featured
        int display_order
        timestamp created_at
    }

    price_histories {
        uuid id PK
        uuid product_id FK
        decimal old_price
        decimal new_price
        string changed_by
        timestamp changed_at
    }
```

### Application Flowchart

```mermaid
flowchart TD
    subgraph Customer["Customer Journey"]
        A[Customer sends WhatsApp message] --> B{Message Type?}
        B -->|Text| C[Python Bot receives webhook]
        B -->|Image| D[Save media & process]
    end

    subgraph BotProcessing["Bot Processing"]
        C --> E{Intent Detection}
        E -->|Greeting| F[Send welcome message]
        E -->|Price Inquiry| G[Fetch product prices]
        E -->|Order| H[Start order flow]
        E -->|Status Check| I[Lookup order status]
        E -->|Unknown| J[Forward to operator]

        G --> K[Format price list]
        K --> L[Send via WA API]

        H --> M[Collect order details]
        M --> N[Create order in DB]
        N --> O[Send confirmation]
    end

    subgraph AdminDashboard["Admin Dashboard"]
        P[Admin Login] --> Q[Dashboard Overview]
        Q --> R{Action?}
        R -->|Manage Products| S[CRUD Products]
        R -->|Process Orders| T[Update Order Status]
        R -->|Handle Chats| U[Respond to customers]
        R -->|View Reports| V[Analytics & SLA metrics]

        T --> W[Trigger notification]
        W --> L
    end

    subgraph DataFlow["Data Layer"]
        N --> X[(MySQL)]
        S --> X
        T --> X
        X --> Y[(Redis Cache)]
        Y --> G
    end
```

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| PHP | 8.2+ | Server-side language |
| Laravel | 11.x | Web framework |
| MySQL | 8.0+ | Primary database |
| Redis | 7.x | Caching & queue |

### Bot Service
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Bot runtime |
| httpx | latest | Async HTTP client |
| redis-py | latest | Redis connection |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI library |
| Inertia.js | 1.x | SPA adapter |
| Tailwind CSS | 3.x | Styling |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| GitHub Actions | CI/CD pipeline |
| Nginx | Web server |

---

## Instalasi

### Prerequisites

Pastikan sistem kamu sudah terinstall:

- PHP >= 8.2 dengan extensions: BCMath, Ctype, JSON, Mbstring, OpenSSL, PDO, Tokenizer, XML
- Composer 2.x
- Node.js >= 18 & npm
- Python >= 3.11
- MySQL >= 8.0
- Redis >= 7.0
- Git

### Step-by-Step Installation

#### 1. Clone Repository

```bash
git clone https://github.com/el-pablos/whatsapp-sla.git
cd whatsapp-sla
```

#### 2. Setup Laravel Backend

```bash
# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database di .env, lalu jalankan migration
php artisan migrate --seed

# Install frontend dependencies
npm install

# Build assets
npm run build
```

#### 3. Setup Python Bot

```bash
# Masuk ke direktori bot
cd python-bot

# Buat virtual environment
python -m venv venv

# Aktivasi virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 4. Configure Redis

Pastikan Redis server berjalan, lalu update `.env`:

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=null
```

#### 5. Configure WhatsApp Business API

Dapatkan kredensial dari [Meta for Developers](https://developers.facebook.com/), lalu update `.env`:

```env
WA_API_URL=https://graph.facebook.com/v18.0
WA_PHONE_NUMBER_ID=your_phone_number_id
WA_ACCESS_TOKEN=your_access_token
WA_VERIFY_TOKEN=your_verify_token
WA_APP_ID=your_app_id
WA_APP_SECRET=your_app_secret
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_NAME` | Nama aplikasi | `WhatsApp SLA` |
| `APP_ENV` | Environment | `local`, `production` |
| `APP_DEBUG` | Debug mode | `true`, `false` |
| `APP_URL` | Base URL aplikasi | `http://localhost` |
| `DB_CONNECTION` | Database driver | `mysql` |
| `DB_HOST` | Database host | `127.0.0.1` |
| `DB_PORT` | Database port | `3306` |
| `DB_DATABASE` | Nama database | `whatsapp_sla` |
| `DB_USERNAME` | Database user | `root` |
| `DB_PASSWORD` | Database password | `secret` |
| `REDIS_HOST` | Redis host | `127.0.0.1` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | `null` |
| `WA_PHONE_NUMBER_ID` | WhatsApp Phone ID | `123456789` |
| `WA_ACCESS_TOKEN` | WhatsApp API Token | `EAAxxxxx` |
| `WA_VERIFY_TOKEN` | Webhook verify token | `my_verify_token` |

---

## Menjalankan Aplikasi

### Development Mode

```bash
# Terminal 1: Laravel server
php artisan serve

# Terminal 2: Vite dev server (untuk hot reload)
npm run dev

# Terminal 3: Queue worker
php artisan queue:work

# Terminal 4: Python bot
cd python-bot
python main.py
```

Akses aplikasi di: `http://localhost:8000`

### Production Mode

```bash
# Build frontend assets
npm run build

# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Jalankan dengan supervisor untuk queue & bot
```

### Menggunakan Docker

```bash
# Build dan jalankan semua services
docker-compose up -d

# Akses aplikasi
# Web: http://localhost:8000
# Database: localhost:3306
# Redis: localhost:6379
```

---

## API Documentation

### Authentication

Semua API endpoint (kecuali login) memerlukan Bearer token:

```
Authorization: Bearer {your_token}
```

### Base URL

```
Development: http://localhost:8000/api/v1
Production: https://your-domain.com/api/v1
```

### Endpoints

#### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login dan dapatkan token |
| POST | `/auth/logout` | Logout dan invalidate token |
| GET | `/auth/me` | Get current user info |

#### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List semua produk |
| GET | `/products/{id}` | Detail produk |
| POST | `/products` | Tambah produk baru |
| PUT | `/products/{id}` | Update produk |
| DELETE | `/products/{id}` | Hapus produk |

#### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | List semua pesanan |
| GET | `/orders/{id}` | Detail pesanan |
| POST | `/orders` | Buat pesanan baru |
| PATCH | `/orders/{id}/status` | Update status pesanan |

#### Chats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chats` | List semua chat |
| GET | `/chats/{id}` | Detail chat dengan messages |
| POST | `/chats/{id}/messages` | Kirim pesan |
| PATCH | `/chats/{id}/assign` | Assign chat ke operator |

#### Webhook (WhatsApp)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/webhook` | Verify webhook (Meta verification) |
| POST | `/webhook` | Receive incoming messages |

### Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // response data here
  },
  "meta": {
    "current_page": 1,
    "total": 100,
    "per_page": 15
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

---

## Project Structure

```
whatsapp-sla/
├── app/
│   ├── Http/
│   │   ├── Controllers/     # API & Web controllers
│   │   ├── Middleware/      # Auth, rate limiting, etc
│   │   └── Requests/        # Form request validation
│   ├── Models/              # Eloquent models
│   ├── Services/            # Business logic services
│   └── Jobs/                # Queue jobs
├── config/                  # Configuration files
├── database/
│   ├── migrations/          # Database migrations
│   └── seeders/            # Data seeders
├── python-bot/
│   ├── handlers/           # Message handlers
│   ├── services/           # Bot services
│   ├── main.py            # Bot entry point
│   └── requirements.txt   # Python dependencies
├── resources/
│   ├── js/                # React components
│   ├── css/               # Stylesheets
│   └── views/             # Blade templates
├── routes/
│   ├── api.php           # API routes
│   └── web.php           # Web routes
├── tests/                # Test suites
├── docker-compose.yml    # Docker configuration
└── README.md            # This file
```

---

## Screenshots

<p align="center">
  <i>Screenshots will be added once the UI is implemented</i>
</p>

| Dashboard | Orders | Chat Monitor |
|-----------|--------|--------------|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Orders](docs/screenshots/orders.png) | ![Chat](docs/screenshots/chat.png) |

---

## Kontributor

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/el-pablos">
        <img src="https://github.com/el-pablos.png" width="100px;" alt="el-pablos"/><br />
        <sub><b>el-pablos</b></sub>
      </a><br />
      <sub>Project Lead</sub>
    </td>
  </tr>
</table>

### Contributing

Kontribusi sangat diterima! Silakan baca [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan kontribusi.

1. Fork repository ini
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Support

Jika ada pertanyaan atau butuh bantuan:

- Buat [Issue](https://github.com/el-pablos/whatsapp-sla/issues) untuk bug reports
- Buka [Discussion](https://github.com/el-pablos/whatsapp-sla/discussions) untuk pertanyaan umum

---

<p align="center">
  Made with care for local egg farmers
  <br/>
  <sub>WhatsApp SLA - Ayam Petelur Business Solution</sub>
</p>
