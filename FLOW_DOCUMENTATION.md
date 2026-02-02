# 📋 Flow Documentation - RenderTool

## 🎯 TỔNG QUAN PROJECT

RenderTool gồm 2 phần:
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Auth**: NextAuth.js, Google OAuth

---

## 📊 FLOW CHÍNH CỦA PROJECT

### 1. **User Authentication Flow** 🔐

#### 1.1. Flow Đăng Nhập

```
User truy cập website (chưa đăng nhập)
    ↓
[Homepage] → Click "Đăng nhập" ở Header
    ↓
Redirect → [Login Page] (/login)
    ↓
[Login Page] → Click "Đăng nhập với Google"
    ↓
NextAuth.js → Redirect đến Google OAuth
    ↓
User xác nhận trên Google
    ↓
Google OAuth → Callback về NextAuth
    ↓
NextAuth callback → Gọi API `/api/auth/google` (Backend)
    ├─ POST /api/auth/google
    │   ├─ Request: { token, email, name, avatar_url }
    │   └─ Backend: Verify token
    │       - Production: verify bằng `google.oauth2.id_token.verify_oauth2_token`
    │       - Dev: có thể skip nếu thiếu `GOOGLE_CLIENT_ID` hoặc ENV=development
    ↓
Backend Route (`backend/api/routes/auth.py`):
    ├─ Query User theo email
    ├─ Nếu User tồn tại:
    │   └─ Update: name, picture (avatar_url)
    └─ Nếu User không tồn tại:
        └─ Tạo User mới: id (UUID), email, name, picture, credits=0.0
    ↓
Backend → Return: { user_id, email, name, credits, is_admin }
    ↓
NextAuth → Tạo session cho user (JWT strategy)
    ↓
Frontend → Redirect về Homepage (callbackUrl: '/')
    ↓
User đã đăng nhập → Thấy Header hiển thị tên/email và button "Đăng xuất"
```

#### 1.2. Flow Đăng Xuất

```
User đã đăng nhập → Click "Đăng xuất" ở Header
    ↓
NextAuth signOut() → Xóa session
    ↓
Redirect về Homepage (chưa đăng nhập)
```

#### 1.3. Files liên quan

- **Frontend:**
  - `frontend/app/login/page.tsx` - Login page UI
  - `frontend/lib/auth.ts` - NextAuth config (GoogleProvider, callbacks sync backend)
  - `frontend/app/api/auth/[...nextauth]/route.ts` - NextAuth API route handler (App Router)
  - `frontend/components/Header.tsx` - Header với Login/Logout buttons
  - `frontend/app/layout.tsx` - Wrap `SessionProvider` + render `Header`

- **Backend:**
  - `backend/api/routes/auth.py` - `/api/auth/google` endpoint
  - `backend/models.py` - User model

#### 1.4. Error Handling (hiện tại)

- ❌ Backend auth failed: Log error nhưng vẫn cho phép login (để không chặn trải nghiệm) — có thể siết lại sau
- ❌ Network error khi gọi backend sync trong callback: log error (chưa có UI hiển thị)

---

### 2. **Payment & Credit Flow** 💳

#### 2.1. Flow Nạp Credits (QR Code Payment)

```
User đã đăng nhập → [Credits Page] (/credits)
    ↓
Hiển thị 6 packages:
    - 20 coins / 52,000 VNĐ
    - 60 coins / 130,000 VNĐ
    - 130 coins / 260,000 VNĐ
    - 270 coins / 520,000 VNĐ
    - 700 coins / 1,300,000 VNĐ
    - 1,500 coins / 2,600,000 VNĐ
    ↓
User click "Chuyển khoản (QR)" trên package
    ↓
Mở QRPaymentModal → Tự động gọi API `/api/payments/create-order`
    ↓
Frontend API Route (`frontend/app/api/payments/create-order/route.ts`):
    └─ Proxy POST request → Backend `/api/payments/create-order`
    ↓
Backend Route (`backend/api/routes/payments.py`):
    └─ PaymentService.create_payment_order()
    ↓
PaymentService (`backend/services/payment_service.py`):
    ├─ Check User tồn tại:
    │   ├─ Nếu không → Tạo User mới (temp_user_id)
    │   └─ Nếu có → Sử dụng User hiện tại
    ├─ Generate transaction_id: "TXN-{timestamp}-{random}"
    ├─ Tạo Payment record:
    │   ├─ status: PENDING
    │   ├─ payment_method: "BANK_TRANSFER_QR"
    │   ├─ qr_code_url: VietQR image
    │   ├─ transfer_content: "NAPCOIN{transaction_id}"
    │   ├─ bank_name: "VietinBank"
    │   └─ account_number: "113366668888"
    └─ Return: { transaction_id, qr_code_url, qr_content, ... }
    ↓
Frontend nhận response → Hiển thị:
    ├─ QR Code image
    ├─ Bank info (account, amount, content)
    └─ Status: "Đang chờ thanh toán..."
    ↓
Frontend → Start Polling (mỗi 3 giây):
    └─ GET `/api/payments/{transaction_id}/status`
    ↓
User scan QR code → Chuyển khoản qua banking app
    ↓
[PAYMENT GATEWAY - External]
    ↓
Payment Gateway phát hiện chuyển khoản → Gọi Webhook
    ↓
Webhook → POST `/api/payments/webhook`
    ↓
Backend Route (`backend/api/routes/payments.py`):
    └─ PaymentService.process_webhook()
    ↓
PaymentService.process_webhook():
    ├─ Tìm Payment theo transaction_id
    ├─ Validate:
    │   ├─ Payment tồn tại? → 404 nếu không
    │   ├─ Status đã COMPLETED? → Return early (idempotency)
    │   └─ Amount match? → Validate amount ±0.01
    ├─ Nếu status = "success/completed/paid":
    │   ├─ Update Payment.status → COMPLETED
    │   ├─ CreditService.add_credits():
    │   │   ├─ Update User.credits += payment.coins
    │   │   └─ Tạo CreditTransaction (ADDITION)
    │   └─ Return success
    └─ Nếu status khác:
        ├─ Update Payment.status → FAILED
        └─ Return failed
    ↓
Frontend Polling phát hiện status = "completed"
    ├─ Stop polling
    ├─ Hiển thị: "Thanh toán thành công! Đang cập nhật..."
    ├─ Auto close modal sau 2 giây
    └─ Reload page → Credits được cập nhật
```

#### 2.2. Flow Polling Payment Status

```
QRPaymentModal mount → Start polling interval
    ↓
Mỗi 3 giây:
    └─ GET `/api/payments/{transaction_id}/status`
        ↓
    Backend PaymentService.get_payment_status():
        ├─ Query Payment theo transaction_id
        └─ Return: { status, amount, credits, ... }
        ↓
    Frontend update state:
        ├─ status = "pending" → Tiếp tục polling
        ├─ status = "completed" → Stop polling, show success, reload
        └─ status = "failed" → Stop polling, show error
    ↓
User close modal → Clear polling interval
```

#### 2.3. Files liên quan

- **Frontend:**
  - `frontend/app/credits/page.tsx` - Credits page + packages
  - `frontend/components/QRPaymentModal.tsx` - Modal hiển thị QR + polling status
  - `frontend/app/api/payments/create-order/route.ts` - Proxy tạo order
  - `frontend/app/api/payments/[transaction_id]/status/route.ts` - Proxy status

- **Backend:**
  - `backend/api/routes/payments.py` - `/api/payments/*`
  - `backend/services/payment_service.py` - Create order / status / webhook processing
  - `backend/services/credit_service.py` - Add credits + transaction
  - `backend/models.py` - `Payment`, `CreditTransaction`, `User`

