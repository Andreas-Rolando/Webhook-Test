const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// KONFIGURASI SECRET KEY
// Ganti nilai ini dengan secret key Anda sendiri
// =============================================
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "your-super-secret-key-ganti-ini";

// Middleware untuk membaca raw body (penting untuk verifikasi signature)
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// =============================================
// FUNGSI VERIFIKASI SIGNATURE
// Memastikan request benar-benar dari pengirim yang sah
// =============================================
function verifySignature(req) {
  const signature = req.headers["x-webhook-signature"];
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest("hex");

  const expectedHeader = `sha256=${expectedSignature}`;

  // Gunakan timingSafeEqual untuk mencegah timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedHeader)
    );
  } catch {
    return false;
  }
}

// =============================================
// FUNGSI SIMPAN LOG ORDER
// =============================================
function saveOrderLog(orderData) {
  const logDir = path.join(__dirname, "logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `order_${orderData.orderID}_${timestamp}.json`;
  const filepath = path.join(logDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(orderData, null, 2));
  console.log(`📁 Order log disimpan: ${filename}`);
}

// =============================================
// FUNGSI PROSES DATA ORDER
// Tambahkan logika bisnis Anda di sini
// =============================================
function processOrder(orderData) {
  const {
    orderID,
    fullName,
    phoneNumber,
    deliveryAddress,
    grandTotal,
    currencySign,
    status,
    orderTypeName,
    branchName,
    salesMenus,
    salesPayment,
    promotionCode,
    discountTotal,
  } = orderData;

  console.log("=".repeat(50));
  console.log("📦 ORDER BARU DITERIMA");
  console.log("=".repeat(50));
  console.log(`🆔 Order ID     : ${orderID}`);
  console.log(`👤 Nama         : ${fullName}`);
  console.log(`📱 Telepon      : ${phoneNumber}`);
  console.log(`🏪 Cabang       : ${branchName}`);
  console.log(`🚚 Tipe         : ${orderTypeName}`);
  console.log(`📍 Alamat       : ${deliveryAddress}`);
  console.log(`🏷️  Promo        : ${promotionCode || "Tidak ada"}`);
  console.log(`💸 Diskon       : ${currencySign}${discountTotal.toLocaleString()}`);
  console.log(`💰 Total        : ${currencySign}${grandTotal.toLocaleString()}`);
  console.log(`💳 Pembayaran   : ${salesPayment?.paymentMethodID?.toUpperCase()} (${salesPayment?.paymentStatus})`);
  console.log(`📋 Status       : ${status}`);
  console.log("-".repeat(50));
  console.log("🍽️  ITEM PESANAN:");

  salesMenus?.forEach((menu, index) => {
    console.log(`  ${index + 1}. ${menu.menuName} x${menu.qty} - ${currencySign}${menu.sellPrice.toLocaleString()}`);
    menu.packages?.forEach((pkg) => {
      console.log(`     └─ [Paket] ${pkg.menuName}`);
    });
    menu.extras?.forEach((extra) => {
      console.log(`     └─ [Extra] ${extra.menuExtraName} x${extra.qty} - ${currencySign}${extra.sellPrice.toLocaleString()}`);
    });
  });

  console.log("=".repeat(50));

  // Kembalikan ringkasan untuk response
  return {
    orderID,
    customerName: fullName,
    totalItems: salesMenus?.length || 0,
    grandTotal,
    paymentStatus: salesPayment?.paymentStatus,
    orderStatus: status,
  };
}

// =============================================
// ENDPOINT UTAMA: TERIMA WEBHOOK
// POST /webhook/order
// =============================================
app.post("/webhook/order", (req, res) => {
  console.log(`\n🔔 [${new Date().toISOString()}] Webhook diterima dari ${req.ip}`);

  // 1. Verifikasi secret key / signature
  if (!verifySignature(req)) {
    console.warn("❌ Signature tidak valid! Request ditolak.");
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid signature",
    });
  }

  console.log("✅ Signature valid");

  // 2. Validasi body tidak kosong
  const orderData = req.body;
  if (!orderData || !orderData.orderID) {
    console.warn("❌ Data order tidak valid atau tidak lengkap");
    return res.status(400).json({
      success: false,
      message: "Bad Request: Invalid or missing order data",
    });
  }

  try {
    // 3. Simpan log order ke file
    saveOrderLog(orderData);

    // 4. Proses data order
    const summary = processOrder(orderData);

    // 5. Kirim respons sukses
    return res.status(200).json({
      success: true,
      message: "Order berhasil diterima dan diproses",
      data: summary,
    });

  } catch (error) {
    console.error("❌ Error saat memproses order:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

// =============================================
// ENDPOINT CEK KESEHATAN SERVER
// GET /health
// =============================================
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Webhook server berjalan",
    timestamp: new Date().toISOString(),
  });
});

// =============================================
// ENDPOINT ROOT
// =============================================
app.get("/", (req, res) => {
  res.json({
    message: "Webhook Server Aktif",
    endpoints: {
      webhook: "POST /webhook/order",
      health: "GET /health",
    },
  });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`\n🚀 Webhook server berjalan di port ${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/webhook/order`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`\n⚠️  PENTING: Ganti WEBHOOK_SECRET di file .env sebelum deploy!\n`);
});
