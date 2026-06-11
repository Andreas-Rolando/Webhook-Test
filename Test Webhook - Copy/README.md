# 🔔 Webhook Server - Penerima Data Order

Webhook server ini menerima data order dengan verifikasi **Secret Key** menggunakan HMAC SHA256.

---

## 📁 Struktur File

```
webhook-server/
├── server.js          ← File utama server
├── test-webhook.js    ← Script untuk testing
├── package.json       ← Konfigurasi project
├── .env.example       ← Contoh file konfigurasi
├── .env               ← Konfigurasi Anda (BUAT SENDIRI, jangan di-upload)
├── .gitignore
└── logs/              ← Log order masuk (dibuat otomatis)
```

---

## 🛠️ CARA INSTALASI & MENJALANKAN (Lokal)

### Langkah 1 — Install Node.js
Unduh dan install Node.js dari: https://nodejs.org  
Pilih versi **LTS** (Long Term Support).

Cek apakah berhasil:
```bash
node --version
npm --version
```

### Langkah 2 — Buat folder & masuk ke dalamnya
```bash
mkdir webhook-server
cd webhook-server
```

### Langkah 3 — Salin semua file ke folder ini

### Langkah 4 — Install dependencies
```bash
npm install
```

### Langkah 5 — Buat file .env
Salin file `.env.example` menjadi `.env`:
```bash
# Windows:
copy .env.example .env

# Mac/Linux:
cp .env.example .env
```

Lalu buka file `.env` dan ganti secret key:
```
WEBHOOK_SECRET=rahasia-saya-yang-sangat-kuat-123xyz
PORT=3000
```

> 💡 **Tips membuat secret key yang kuat:**  
> Gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol.  
> Contoh: `Kf9#mP2$xQz7!nRv4@wLd6`

### Langkah 6 — Jalankan server
```bash
node server.js
```

Output yang muncul:
```
🚀 Webhook server berjalan di port 3000
📡 Endpoint: http://localhost:3000/webhook/order
❤️  Health check: http://localhost:3000/health
```

### Langkah 7 — Test webhook (terminal baru)
```bash
node test-webhook.js
```

---

## 🌐 CARA DEPLOY KE INTERNET (Render.com — GRATIS)

### Langkah 1 — Buat akun GitHub
Daftar di https://github.com (gratis)

### Langkah 2 — Upload project ke GitHub
1. Buat repository baru di GitHub
2. Upload semua file **KECUALI** file `.env` dan folder `node_modules`

### Langkah 3 — Daftar Render.com
1. Buka https://render.com
2. Klik **"Get Started for Free"**
3. Login menggunakan akun GitHub Anda

### Langkah 4 — Buat Web Service baru
1. Klik **"New +"** → pilih **"Web Service"**
2. Pilih repository GitHub yang sudah Anda upload
3. Isi konfigurasi:
   - **Name**: `webhook-order-server`
   - **Region**: Singapore (paling dekat dengan Indonesia)
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free

### Langkah 5 — Set Environment Variables di Render
Di halaman Web Service Anda, klik tab **"Environment"**:
- Klik **"Add Environment Variable"**
- Key: `WEBHOOK_SECRET`
- Value: (isi dengan secret key Anda)
- Klik **"Save Changes"**

### Langkah 6 — Deploy
Klik **"Create Web Service"** — Render akan otomatis build dan deploy.

Setelah selesai, Anda akan mendapat URL seperti:
```
https://webhook-order-server.onrender.com
```

**Endpoint webhook Anda:**
```
https://webhook-order-server.onrender.com/webhook/order
```

---

## 🔑 CARA KERJA SECRET KEY

Setiap request ke webhook harus menyertakan header:
```
x-webhook-signature: sha256=<HMAC_SHA256_dari_body>
```

Cara membuat signature di sisi pengirim (contoh Node.js):
```javascript
const crypto = require("crypto");
const body = JSON.stringify(dataOrder);
const signature = "sha256=" + crypto
  .createHmac("sha256", "secret-key-anda")
  .update(body)
  .digest("hex");

// Kirim di header:
// "x-webhook-signature": signature
```

Jika signature tidak cocok → server akan menolak dengan status **401 Unauthorized**.

---

## 📡 ENDPOINT

| Method | URL | Keterangan |
|--------|-----|------------|
| POST | `/webhook/order` | Terima data order |
| GET | `/health` | Cek status server |

---

## 📋 CONTOH RESPONSE SUKSES

```json
{
  "success": true,
  "message": "Order berhasil diterima dan diproses",
  "data": {
    "orderID": "SAEOUT1BAXMOQ",
    "customerName": "Jhon Doe",
    "totalItems": 1,
    "grandTotal": 340500,
    "paymentStatus": "settlement",
    "orderStatus": "Order Confirmed"
  }
}
```

---

## ❓ TROUBLESHOOTING

**Error: `Cannot find module 'express'`**  
→ Jalankan `npm install` terlebih dahulu

**Error: `EADDRINUSE port 3000`**  
→ Port sudah dipakai, ganti PORT di `.env` menjadi 3001

**Response 401 Unauthorized**  
→ Secret key di pengirim dan server tidak cocok, periksa kembali

**Server Render tidak jalan**  
→ Pastikan `WEBHOOK_SECRET` sudah diset di Environment Variables Render
