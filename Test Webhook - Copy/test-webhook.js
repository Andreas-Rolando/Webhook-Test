/**
 * TEST SCRIPT - Kirim contoh order ke webhook server
 * Jalankan dengan: node test-webhook.js
 * 
 * Pastikan server sudah berjalan terlebih dahulu!
 */

const crypto = require("crypto");
const http = require("http");

// ⚠️ Harus sama dengan WEBHOOK_SECRET di server
const SECRET_KEY = "your-super-secret-key-ganti-ini";
const WEBHOOK_URL = "http://localhost:3000/webhook/order";

// Contoh data order (sama dengan JSON yang Anda berikan)
const orderData = {
  orderID: "SAEOUT1BAXMOQ",
  deliveryTransactionID: "EZD16675370357964",
  salesNum: "SOUT1166753713066",
  billNum: "ESODM202211040002",
  transactionDate: "2022-11-04T11:43:52+07:00",
  additionalCustomerInfo: null,
  fullName: "Jhon Doe",
  phoneNumber: "62xxxxxxxxxxx",
  deliveryAddressLabel: null,
  deliveryAddress: "Rawa Badak Lurah, RT.2/RW.10, Ps. Manggis, Setia Budi, Kota Jakarta Selatan, DKI Jakarta 12970, Indonesia.",
  promotionCode: "PROMO50K",
  originalDeliveryCost: 300000,
  deliveryCost: 300000,
  currencySign: "Rp",
  voucherDiscountTotal: 0,
  orderType: "delivery",
  orderTypeName: "Delivery",
  branchName: "OUTLET Tangerang 1",
  grandTotal: 340500,
  discountTotal: 50000,
  subtotal: 78354.9784,
  status: "Order Confirmed",
  salesMenus: [
    {
      ID: 380,
      menuName: "SERABI",
      qty: 1,
      sellPrice: 10000,
      statusName: "Preparing",
      packages: [
        { menuName: "AYAM TALIWANG", qty: 1, sellPrice: 0 }
      ],
      extras: [
        { menuExtraName: "JUS APEL", qty: 1, sellPrice: 5000 }
      ]
    }
  ],
  salesPayment: {
    paymentMethodID: "ovo",
    paymentStatus: "settlement",
    paymentTotal: 340500
  }
};

// Konversi data ke JSON string
const body = JSON.stringify(orderData);

// Buat signature menggunakan HMAC SHA256
const signature = "sha256=" + crypto
  .createHmac("sha256", SECRET_KEY)
  .update(body)
  .digest("hex");

console.log("🚀 Mengirim test webhook...");
console.log(`📍 URL: ${WEBHOOK_URL}`);
console.log(`🔑 Signature: ${signature.substring(0, 30)}...`);

// Kirim HTTP request
const url = new URL(WEBHOOK_URL);
const options = {
  hostname: url.hostname,
  port: url.port || 80,
  path: url.pathname,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
    "x-webhook-signature": signature,
  },
};

const req = http.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => { data += chunk; });
  res.on("end", () => {
    console.log(`\n✅ Response Status: ${res.statusCode}`);
    console.log("📄 Response Body:");
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch {
      console.log(data);
    }
  });
});

req.on("error", (error) => {
  console.error("❌ Error:", error.message);
  console.error("Pastikan server sudah berjalan dengan: node server.js");
});

req.write(body);
req.end();
