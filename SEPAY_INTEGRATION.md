# SePay QR Code Integration

## 📋 Tổng quan

Hệ thống đã được tích hợp với SePay QR Code payment system từ `https://qr-moniter.up.railway.app/`.

## 🔄 Thay đổi chính

### Backend

1. **PaymentService** (`backend/services/payment_service.py`):
   - `create_payment_order()`: Gọi SePay API để tạo payment order và nhận QR code động
   - `process_webhook()`: Xử lý cả SePay webhook format và legacy format (backward compatible)
   - Hỗ trợ fallback về phương thức cũ nếu SePay API lỗi

2. **Payment Routes** (`backend/api/routes/payments.py`):
   - Webhook endpoint hỗ trợ cả SePay format và legacy format
   - Status endpoint hỗ trợ cả `payment_code` (SePay) và `transaction_id` (legacy)
   - Tự động poll SePay API để cập nhật status real-time

3. **Payment Model** (`backend/models.py`):
   - Đã có sẵn field `payment_code` (không cần migration)

### Frontend

1. **QRPaymentModal** (`frontend/components/QRPaymentModal.tsx`):
   - Hỗ trợ hiển thị SePay QR code
   - Tự động detect SePay vs legacy payment method
   - Polling status với cả `payment_code` và `transaction_id`

2. **API Routes**:
   - Không cần thay đổi (chỉ là proxy)

## ⚙️ Environment Variables

**QUAN TRỌNG:** Thêm vào `backend/.env` (BẮT BUỘC):

```env
# SePay QR Code Payment Integration (REQUIRED - không có fallback)
SEPAY_API_URL=https://qr-moniter.up.railway.app
CLIENT_WEBHOOK_URL=http://localhost:8000/api/payments/webhook

# Production: Thay đổi CLIENT_WEBHOOK_URL thành domain thực tế (public accessible)
# CLIENT_WEBHOOK_URL=https://yourdomain.com/api/payments/webhook
```

**Lưu ý:**
- Hệ thống **KHÔNG còn fallback** về QR code tĩnh nữa
- Nếu SePay API lỗi → sẽ trả về error, không tạo payment order
- `CLIENT_WEBHOOK_URL` phải là URL public accessible để SePay có thể gọi webhook

## 🔄 Flow hoạt động

### 1. Tạo Payment Order

```
User → Click "Chuyển Khoản Qua QR"
  → Frontend: POST /api/payments/create-order
  → Backend: PaymentService.create_payment_order()
  → Backend: Gọi SePay API POST /payments
  → SePay: Trả về { paymentCode, qrUrl }
  → Backend: Lưu payment_code vào database
  → Frontend: Hiển thị QR code từ qrUrl
```

### 2. Polling Status

```
Frontend: Polling GET /api/payments/{payment_code}/status (mỗi 3s)
  → Backend: Kiểm tra local status
  → Backend: Nếu có payment_code, gọi SePay API GET /payments/{payment_code}
  → Backend: Cập nhật status nếu SePay status thay đổi
  → Frontend: Hiển thị status (pending/paid/expired/cancelled)
```

### 3. Webhook Flow

```
User chuyển khoản → SePay nhận được
  → SePay: Gọi CLIENT_WEBHOOK_URL với payload:
    {
      "paymentCode": "PAYX20260127X001",
      "status": "paid",
      "amount": 10000,
      "paidAt": "2026-01-27T11:54:03.000Z",
      "productCode": "PKG_1",
      "customerCode": "user_id"
    }
  → Backend: PaymentService.process_webhook()
  → Backend: Match payment qua payment_code
  → Backend: Cập nhật Payment.status = COMPLETED
  → Backend: CreditService.add_credits() → Cộng credits
  → Frontend: Polling phát hiện status = completed → Reload credits
```

## 🔄 Backward Compatibility

Hệ thống vẫn hỗ trợ phương thức cũ (legacy):
- Nếu SePay API lỗi → Tự động fallback về QR code tĩnh (VietinBank)
- Webhook endpoint hỗ trợ cả SePay format và legacy format
- Status endpoint hỗ trợ cả `payment_code` và `transaction_id`

## 📊 SePay API Endpoints

### Create Payment Order
```
POST https://qr-moniter.up.railway.app/payments
Body: {
  "productCode": "PKG_1",
  "customerCode": "user_id",
  "amount": 50000,
  "clientWebhookUrl": "https://yourdomain.com/api/payments/webhook"
}
Response: {
  "paymentCode": "PAYX20260127X001",
  "qrUrl": "https://qr.sepay.vn/img?..."
}
```

### Get Payment Status
```
GET https://qr-moniter.up.railway.app/payments/{paymentCode}
Response: {
  "paymentCode": "PAYX20260127X001",
  "status": "paid",  // pending, paid, expired, cancelled
  "amount": 10000,
  "qrUrl": "https://qr.sepay.vn/img?...",
  "paidAt": "2026-01-27T11:54:03.000Z"  // null nếu chưa paid
}
```

## 🧪 Testing

### Test với SePay API

1. Tạo payment order → Kiểm tra có nhận được `payment_code` và `qrUrl`
2. Quét QR code → Kiểm tra SePay có gọi webhook không
3. Polling status → Kiểm tra status có cập nhật không

### Test fallback

1. Tắt SePay API hoặc set `SEPAY_API_URL` sai
2. Tạo payment order → Phải fallback về QR code tĩnh
3. Vẫn hoạt động bình thường với phương thức cũ

## 📝 Notes

- SePay payment code có format: `PAYX{YYYYMMDD}X{XXX}`
- QR code từ SePay là dynamic, tự động hết hạn sau 30 phút
- Webhook từ SePay sẽ được gọi tự động khi thanh toán thành công
- Hệ thống tự động match payment qua `payment_code` hoặc `transaction_id`

## 🚀 Production Deployment

1. Set `SEPAY_API_URL` trong production environment
2. Set `CLIENT_WEBHOOK_URL` thành domain thực tế (public accessible)
3. Đảm bảo webhook endpoint có thể nhận POST request từ SePay
4. Test webhook với SePay test environment trước khi deploy production

