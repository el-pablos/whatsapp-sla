# Entity Relationship Diagram

## WhatsApp SLA - Database Schema

```mermaid
erDiagram
    users {
        bigint id PK
        varchar name
        varchar email UK
        varchar password
        enum role "admin|operator|viewer"
        varchar phone
        timestamp email_verified_at
        varchar remember_token
        timestamp created_at
        timestamp updated_at
    }

    products {
        bigint id PK
        varchar name
        enum type "telur|ayam"
        varchar size
        varchar unit
        decimal price
        int stock
        varchar image
        enum status "active|inactive"
        timestamp created_at
        timestamp updated_at
    }

    orders {
        bigint id PK
        varchar customer_name
        varchar customer_phone
        enum status "pending|confirmed|processing|completed|cancelled"
        decimal total
        text notes
        timestamp created_at
        timestamp updated_at
    }

    order_items {
        bigint id PK
        bigint order_id FK
        bigint product_id FK
        int qty
        decimal price
        decimal subtotal
        timestamp created_at
        timestamp updated_at
    }

    chats {
        bigint id PK
        varchar customer_phone UK
        varchar customer_name
        enum status "bot|admin"
        timestamp last_message_at
        timestamp created_at
        timestamp updated_at
    }

    messages {
        bigint id PK
        bigint chat_id FK
        text content
        enum type "text|image|button"
        enum direction "in|out"
        timestamp created_at
        timestamp updated_at
    }

    catalogs {
        bigint id PK
        varchar name
        varchar image
        text description
        enum status "active|inactive"
        timestamp created_at
        timestamp updated_at
    }

    catalog_products {
        bigint catalog_id PK,FK
        bigint product_id PK,FK
    }

    price_histories {
        bigint id PK
        bigint product_id FK
        decimal old_price
        decimal new_price
        bigint changed_by FK
        timestamp created_at
        timestamp updated_at
    }

    %% Relationships
    orders ||--o{ order_items : "has"
    products ||--o{ order_items : "in"
    chats ||--o{ messages : "contains"
    catalogs ||--o{ catalog_products : "includes"
    products ||--o{ catalog_products : "listed_in"
    products ||--o{ price_histories : "tracks"
    users ||--o{ price_histories : "changed_by"
```

## Relasi Antar Tabel

| Tabel | Relasi | Tabel Target | Keterangan |
|-------|--------|--------------|------------|
| orders | 1:N | order_items | Satu order punya banyak item |
| products | 1:N | order_items | Produk bisa ada di banyak order |
| chats | 1:N | messages | Satu chat punya banyak pesan |
| catalogs | N:M | products | Katalog berisi banyak produk (pivot: catalog_products) |
| products | 1:N | price_histories | Tracking perubahan harga |
| users | 1:N | price_histories | Siapa yang ubah harga |

## Index Strategy

### users
- `email` - UNIQUE (login)
- `role` - INDEX (filter by role)
- `phone` - INDEX (search)

### products
- `type` - INDEX (filter telur/ayam)
- `status` - INDEX (active products)
- `(type, status)` - COMPOSITE (common filter)

### orders
- `customer_phone` - INDEX (customer lookup)
- `status` - INDEX (filter by status)
- `created_at` - INDEX (date range)
- `(status, created_at)` - COMPOSITE (dashboard)

### order_items
- `(order_id, product_id)` - INDEX (item lookup)

### chats
- `customer_phone` - UNIQUE (identify customer)
- `status` - INDEX (bot vs admin)
- `last_message_at` - INDEX (sort by activity)

### messages
- `(chat_id, created_at)` - INDEX (chat history)
- `direction` - INDEX (in/out filter)

### catalogs
- `status` - INDEX (active catalogs)

### catalog_products
- `(catalog_id, product_id)` - PRIMARY (composite key)

### price_histories
- `(product_id, created_at)` - INDEX (price timeline)
