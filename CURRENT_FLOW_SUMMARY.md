# 📋 TÓM TẮT FLOW HIỆN TẠI CỦA HỆ THỐNG

## 🎯 TỔNG QUAN

Hệ thống hiện tại có 3 flow chính:
1. **Authentication Flow** - Đăng nhập với Google OAuth
2. **Payment & Credit Flow** - Nạp tiền qua QR Code
3. **AI Video Generation Flow** - Tạo video AI (chỉ có 1 feature: dance-image-bg)

---

## 1. 🔐 AUTHENTICATION FLOW

### Flow hiện tại:
```
User → Click "Đăng nhập" 
  → NextAuth.js → Google OAuth
  → Callback → POST /api/auth/google (Backend)
  → Backend tạo/cập nhật User trong DB
  → Tạo session → Redirect về Homepage
```

### Files liên quan:
- `frontend/lib/auth.ts` - NextAuth config
- `frontend/app/api/auth/[...nextauth]/route.ts` - NextAuth handler
- `backend/api/routes/auth.py` - Backend auth endpoint
- `backend/models.py` - User model

### Status: ✅ Hoạt động

---

## 2. 💳 PAYMENT & CREDIT FLOW

### Flow hiện tại:
```
User → /credits page → Chọn package
  → Click "Chuyển khoản (QR)"
  → POST /api/payments/create-order
  → Backend tạo Payment record (status: PENDING)
  → Trả về QR code + thông tin chuyển khoản
  → Frontend polling GET /api/payments/{transaction_id}/status (mỗi 3s)
  → Payment Gateway webhook → POST /api/payments/webhook
  → Backend cập nhật Payment.status = COMPLETED
  → CreditService.add_credits() → Cộng credits vào User
  → Frontend phát hiện status = completed → Reload page
```

### Database:
- **Payment** table: lưu thông tin thanh toán
- **CreditTransaction** table: lưu lịch sử cộng credits
- **User.credits**: số credits hiện tại

### Files liên quan:
- `frontend/app/credits/page.tsx` - Credits page
- `frontend/components/QRPaymentModal.tsx` - Payment modal
- `backend/api/routes/payments.py` - Payment endpoints
- `backend/services/payment_service.py` - Payment logic
- `backend/services/credit_service.py` - Credit management

### Status: ✅ Hoạt động

---

## 3. 🎬 AI VIDEO GENERATION FLOW (dance-image-bg)

### Flow hiện tại:
```
User → /dance-image-bg page
  → Upload image + video
  → Click "Tạo Video"
  → POST /api/videos/dance-image-bg
  → Backend:
      ├─ Validate files
      ├─ check_and_reserve_credits() → Tạo CreditReservation
      ├─ Tạo VideoJob (status: PENDING, progress: 0)
      └─ VideoAIService.process_dance_image_bg() (background thread)
  → Frontend nhận job_id → Start polling GET /api/videos/{job_id}/progress (mỗi 3s)
  → VideoAIService._process_job():
      ├─ Update status = PROCESSING
      ├─ Simulate progress: 20% → 40% → 60% → 80% → 100% (mỗi 2s)
      ├─ Update status = COMPLETED
      ├─ Set result_url (hiện tại: fake URL)
      └─ complete_reservation() → Trừ credits
  → Frontend phát hiện status = completed → Mở result_url
```

### Database:
- **VideoJob** table:
  - `id`, `user_id`, `feature_type`
  - `status`: PENDING → PROCESSING → COMPLETED/FAILED
  - `progress`: 0-100
  - `result_url`: URL kết quả
  - `reservation_id`: link đến CreditReservation
- **CreditReservation** table:
  - `status`: PENDING → COMPLETED (khi job xong)
  - `amount`: số credits đã reserve

### Files liên quan:
- `frontend/app/dance-image-bg/page.tsx` - Feature page
- `frontend/app/api/videos/dance-image-bg/route.ts` - API proxy
- `backend/api/routes/videos.py` - Video endpoints
- `backend/services/video_ai_service.py` - AI processing (hiện tại chỉ simulate)
- `backend/api/utils/credits.py` - Credit reservation logic

### Status: ⚠️ Hoạt động nhưng chỉ SIMULATE (chưa có AI thật)

---

## 4. 📊 DASHBOARD FLOW

### Flow hiện tại:
```
User → /dashboard page
  → GET /api/jobs?user_id={user_id}&status={status}
  → Backend query VideoJob theo user_id
  → Trả về danh sách jobs
  → Frontend hiển thị với filters
```

### Files liên quan:
- `frontend/app/dashboard/page.tsx` - Dashboard page
- `backend/api/routes/jobs.py` - Jobs endpoint

### Status: ✅ Hoạt động

---

## 🔍 CHI TIẾT DATABASE MODELS

### User
```python
- id (String, PK)
- email (String, unique)
- name (String)
- picture (String, nullable)
- google_id (String, nullable)
- credits (Float, default=0.0)
- created_at, updated_at
```

### Payment
```python
- id (String, PK)
- user_id (FK)
- transaction_id (String, unique)
- status: PENDING | COMPLETED | FAILED | CANCELLED
- amount, coins
- qr_code_url, bank_name, account_number, transfer_content
- created_at, updated_at, completed_at
```

### CreditTransaction
```python
- id (String, PK)
- user_id (FK)
- transaction_type: "PAYMENT" | "RESERVATION" | "DEDUCTION" | "REFUND" | "RELEASE"
- amount (Float)
- balance_before, balance_after
- description, reference_id
- created_at, updated_at
```

### CreditReservation
```python
- id (String, PK)
- user_id (FK)
- amount (Float)
- status: PENDING | COMPLETED | CANCELLED
- created_at, completed_at
```

### VideoJob
```python
- id (String, PK)
- user_id (FK)
- feature_type (String)  # "dance-image-bg", etc.
- status: PENDING | PROCESSING | COMPLETED | FAILED
- progress (Integer, 0-100)
- result_url (String, nullable)
- error_message (Text, nullable)
- reservation_id (FK, nullable)
- input_file_url (String, nullable)  # Zipline URL
- prompt (Text, nullable)  # Prompt text
- admin_status (String, nullable)  # "pending", "processing", "completed"
- admin_notes (Text, nullable)
- completed_at (DateTime, nullable)
- created_at, updated_at
```

---

## ⚠️ NHỮNG ĐIỂM QUAN TRỌNG

### 1. VideoJob Model đã có sẵn:
- ✅ `input_file_url` - Lưu Zipline URL của file gốc
- ✅ `prompt` - Lưu text prompt
- ✅ `admin_status`, `admin_notes`, `completed_at` - Cho admin workflow

### 2. VideoAIService hiện tại:
- ⚠️ Chỉ **SIMULATE** processing (không có AI thật)
- ⚠️ Progress tăng nhanh: 20% → 40% → 60% → 80% → 100% (mỗi 2s)
- ⚠️ result_url là fake: `https://example.com/results/{job_id}.mp4`

### 3. Credit System:
- ✅ Reservation system hoạt động tốt
- ✅ Credits được reserve trước khi tạo job
- ✅ Credits được trừ khi job completed
- ✅ Nếu job failed → Release reservation (không trừ credits)

### 4. Telegram Service:
- ✅ Đã có `TelegramService` với method `send_job_notification()`
- ⚠️ Chưa được gọi trong flow hiện tại
- ✅ Đã có mapping các feature types

---

## 🎯 FLOW MỚI CẦN IMPLEMENT (theo yêu cầu)

### Flow mới cần làm:
1. **Upload file lên Zipline** trước khi tạo job
2. **Gửi thông báo Telegram** cho admin khi có job mới
3. **Progress bar**: 0-99% trong 15 phút (tăng chậm), sau đó giữ 99% cho đến khi admin xong
4. **Admin xử lý** → Upload kết quả lên Zipline → Cập nhật VideoJob
5. **Frontend polling** phát hiện progress = 100% → Hiển thị kết quả

### Cần thay đổi:
1. **VideoAIService**: Thay vì simulate → Upload file lên Zipline + Gửi Telegram
2. **Progress logic**: Thay đổi từ simulate nhanh → 0-99% trong 15 phút
3. **Admin endpoint**: Tạo endpoint để admin cập nhật kết quả
4. **Zipline integration**: Tích hợp upload file lên Zipline

---

## 📝 TÓM TẮT

### ✅ Đã có:
- Authentication system
- Payment & Credit system
- VideoJob model với đầy đủ fields cần thiết
- Credit reservation system
- Dashboard để xem jobs
- Telegram service (chưa dùng)

### ⚠️ Cần implement:
- Upload file lên Zipline
- Gửi Telegram notification
- Progress bar logic mới (0-99% trong 15 phút)
- Admin endpoint để cập nhật kết quả
- Thay thế VideoAIService simulation bằng workflow mới

### 🔧 Database:
- VideoJob model đã đủ fields, không cần thêm (có thể cần thêm `input_files` JSON nếu muốn lưu nhiều files)

