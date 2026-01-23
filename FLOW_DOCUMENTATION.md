# 📋 Flow Documentation - AI Video Generation App

## 🎯 TỔNG QUAN PROJECT

Ứng dụng tạo video AI với các tính năng:
- AI Nhảy Với Nền Từ Ảnh/Video
- AI Thay Nhân Vật + Copy Video
- AI Nhép Miệng + Biểu Cảm
- AI Hát Theo Nhạc

**Tech Stack:**
- **Frontend**: Next.js 16, React 19, TypeScript, TailwindCSS
- **Backend**: FastAPI, Python 3.13, SQLAlchemy, PostgreSQL
- **Auth**: NextAuth.js, Google OAuth
- **Payment**: QR Code Bank Transfer

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
    │   └─ Backend: Verify token (TODO: chưa implement)
    ↓
Backend Route (`backend/api/routes/auth.py`):
    ├─ Query User theo email
    ├─ Nếu User tồn tại:
    │   └─ Update: name, picture (avatar_url)
    └─ Nếu User không tồn tại:
        └─ Tạo User mới: id (UUID), email, name, picture, credits=0.0
    ↓
Backend → Return: { user_id, email, name, credits }
    ↓
NextAuth → Tạo session cho user
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

#### 1.3. Files liên quan:

- **Frontend:**
  - `frontend/app/login/page.tsx` - Login page UI
  - `frontend/lib/auth.ts` - NextAuth config (GoogleProvider, callbacks)
  - `frontend/app/api/auth/[...nextauth]/route.ts` - NextAuth API route handler
  - `frontend/components/Header.tsx` - Header với Login/Logout buttons

- **Backend:**
  - `backend/api/routes/auth.py` - `/api/auth/google` endpoint
  - `backend/models.py` - User model

#### 1.4. Error Handling:

- ❌ Backend auth failed: Log error nhưng vẫn cho phép login (TODO: implement validation)
- ❌ Network error: Hiển thị error message

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
    │   ├─ qr_code_url: Static VietQR image
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

#### 2.3. Files liên quan:

- **Frontend:**
  - `frontend/app/credits/page.tsx` - Credits page với packages
  - `frontend/components/QRPaymentModal.tsx` - Payment modal với QR code
  - `frontend/app/api/payments/create-order/route.ts` - Next.js API proxy
  - `frontend/app/api/payments/[transactionId]/status/route.ts` - Status polling proxy
  - `frontend/app/api/payments/webhook/route.ts` - Webhook proxy

- **Backend:**
  - `backend/api/routes/payments.py` - Payment endpoints
  - `backend/services/payment_service.py` - Payment business logic
  - `backend/services/credit_service.py` - Credit management
  - `backend/models.py` - Payment, CreditTransaction models

#### 2.4. Error Handling:

- ❌ Tạo payment order failed: Alert error, set status = "failed"
- ❌ Payment không tìm thấy: 404 error
- ❌ Webhook duplicate: Idempotency check → Return early
- ❌ Amount mismatch: Validate và raise error
- ❌ Polling error: Log error, tiếp tục polling (network issues)

---

### 3. **AI Video Generation Flow** 🎬

#### 3.1. Flow Tạo Video AI (dance-image-bg)

```
User đã đăng nhập → [Homepage]
    ↓
Click vào Feature Card: "AI Nhảy Với Nền Từ Ảnh"
    ↓
Redirect → [Dance Image BG Page] (/dance-image-bg)
    ↓
User upload files:
    ├─ Upload ảnh (image) - tỉ lệ 9:16
    └─ Upload video mẫu (video) - tỉ lệ 9:16
    ↓
User click "Tạo Video"
    ↓
Frontend validate:
    ├─ imageFile tồn tại?
    └─ videoFile tồn tại?
    ↓
Nếu thiếu → Alert: "Vui lòng tải lên cả ảnh và video!"
    ↓
Nếu đủ → POST `/api/videos/dance-image-bg`
    ├─ FormData: { image, video }
    └─ Content-Type: multipart/form-data
    ↓
Frontend API Route (`frontend/app/api/videos/dance-image-bg/route.ts`):
    └─ Proxy request → Backend `/api/videos/dance-image-bg`
    ↓
Backend Route (`backend/api/routes/videos.py`):
    ├─ POST /api/videos/dance-image-bg
    └─ create_dance_image_bg()
    ↓
Check & Reserve Credits:
    └─ check_and_reserve_credits() (`backend/api/utils/credits.py`)
        ├─ Estimate cost: CostEstimationService.estimate_cost("dance-image-bg")
        │   └─ Cost: 10.0 coins
        ├─ Query User
        ├─ Check available balance:
        │   ├─ Query pending reservations
        │   ├─ reserved_amount = sum(pending_reservations)
        │   └─ available_balance = user.credits - reserved_amount
        ├─ Nếu available_balance < cost:
        │   └─ Raise ValueError → Return 402 Payment Required
        └─ Nếu đủ:
            ├─ Tạo CreditReservation:
            │   ├─ status: PENDING
            │   ├─ amount: cost
            │   └─ Return reservation_id
            └─ Continue
    ↓
Nếu không đủ credits → Return 402:
    └─ Frontend → Alert: "Không đủ credits!"
    ↓
Nếu đủ credits → Tạo VideoJob:
    ├─ Generate job_id (UUID)
    ├─ Tạo VideoJob record:
    │   ├─ status: PENDING
    │   ├─ progress: 0
    │   ├─ feature_type: "dance-image-bg"
    │   └─ reservation_id: reservation_id
    └─ Return { job_id, status: "pending" }
    ↓
Queue AI Job (async):
    └─ VideoAIService.process_dance_image_bg(job_id, image, video)
        ├─ Run trong background thread
        └─ _process_job(job_id):
            ├─ Query VideoJob
            ├─ Update status → PROCESSING
            ├─ Simulate processing (TODO: implement real AI):
            │   ├─ Progress: 20% → 40% → 60% → 80% → 100%
            │   └─ Sleep 2s mỗi progress update
            ├─ Update status → COMPLETED
            ├─ Set result_url: "https://example.com/results/{job_id}.mp4"
            ├─ complete_reservation(reservation_id):
            │   ├─ Update CreditReservation.status → COMPLETED
            │   ├─ Deduct credits: user.credits -= reservation.amount
            │   └─ (Không tạo CreditTransaction cho deduction - TODO?)
            └─ Commit changes
    ↓
Frontend nhận job_id → Start Polling:
    └─ GET `/api/videos/{job_id}/progress` (mỗi 3 giây)
    ↓
Backend Route (`backend/api/routes/videos.py`):
    └─ get_job_progress(job_id)
        └─ Return: { job_id, status, progress, result_url, error_message }
    ↓
Frontend update UI:
    ├─ status = "processing" → Hiển thị progress bar (0-100%)
    ├─ status = "completed" → Stop polling, open result_url
    └─ status = "failed" → Stop polling, alert "Tạo video thất bại!"
```

#### 3.2. Flow Xem Video Jobs (Dashboard)

```
User đã đăng nhập → Click "Bảng Điều Khiển" ở Header
    ↓
Redirect → [Dashboard Page] (/dashboard)
    ↓
Component mount → Fetch jobs:
    └─ GET `/api/jobs?user_id={user_id}&status={status}`
    ↓
Frontend API Route (`frontend/app/api/jobs/route.ts`):
    └─ Proxy request → Backend `/api/jobs`
    ↓
Backend Route (`backend/api/routes/jobs.py`):
    └─ get_jobs(user_id, status)
        ├─ Query VideoJob theo user_id
        ├─ Filter theo status (nếu có):
        │   ├─ "all" → Không filter
        │   └─ Khác → Filter theo JobStatus enum
        └─ Return: { jobs: [...] }
    ↓
Frontend hiển thị:
    ├─ Filters: Tất cả, Hàng đợi, Đang xử lý, Đã hoàn thành, Chưa thành công
    ├─ Search box (filter theo feature_type)
    ├─ Job list:
    │   ├─ Feature type
    │   ├─ Created date
    │   ├─ Status badge
    │   ├─ Progress bar (nếu processing)
    │   └─ Download button (nếu completed)
    └─ Empty state nếu không có jobs
```

#### 3.3. Files liên quan:

- **Frontend:**
  - `frontend/app/page.tsx` - Homepage với feature cards
  - `frontend/app/dance-image-bg/page.tsx` - Feature page
  - `frontend/app/dashboard/page.tsx` - Dashboard page
  - `frontend/app/api/videos/dance-image-bg/route.ts` - Video creation proxy
  - `frontend/app/api/videos/[jobId]/progress/route.ts` - Progress polling proxy
  - `frontend/app/api/jobs/route.ts` - Jobs list proxy

- **Backend:**
  - `backend/api/routes/videos.py` - Video endpoints
  - `backend/api/routes/jobs.py` - Jobs endpoints
  - `backend/services/video_ai_service.py` - AI processing service
  - `backend/api/utils/credits.py` - Credit check/reservation
  - `backend/services/cost_estimation_service.py` - Cost calculation
  - `backend/services/credit_service.py` - Credit management
  - `backend/models.py` - VideoJob, CreditReservation models

#### 3.4. Error Handling:

- ❌ Upload thiếu files: Alert validation error
- ❌ Không đủ credits: Return 402, alert user
- ❌ Job creation failed: Return 500 error
- ❌ AI processing failed: Update job.status → FAILED, set error_message
- ❌ Polling error: Log error, tiếp tục polling

---

### 4. **Credit Reservation & Deduction Flow** 💰

#### 4.1. Flow Reserve Credits

```
User click "Generate" trên AI feature
    ↓
Backend API → check_and_reserve_credits():
    ├─ Estimate cost (CostEstimationService):
    │   ├─ "dance-image-bg": 10.0 coins
    │   ├─ "dance-video-bg": 10.0 coins
    │   ├─ "replace-ad": 15.0 coins
    │   ├─ "replace-fashion": 15.0 coins
    │   ├─ "lip-sync": 12.0 coins
    │   └─ "sing": 12.0 coins
    ├─ Query User
    ├─ Calculate available balance:
    │   ├─ Query pending CreditReservations
    │   ├─ reserved_amount = sum(pending.amount)
    │   └─ available_balance = user.credits - reserved_amount
    ├─ Check: available_balance >= cost?
    │   ├─ NO → Raise ValueError("Insufficient credits...")
    │   └─ YES → Continue
    └─ Create CreditReservation:
        ├─ id: UUID
        ├─ status: PENDING
        ├─ amount: cost
        └─ Return reservation_id
```

#### 4.2. Flow Complete Reservation (Deduct Credits)

```
AI Job completed → VideoAIService._process_job()
    ↓
complete_reservation(reservation_id):
    ├─ Query CreditReservation
    ├─ Check: status đã COMPLETED?
    │   └─ YES → Return early (idempotency)
    ├─ Deduct credits:
    │   └─ user.credits -= reservation.amount
    ├─ Update reservation:
    │   ├─ status → COMPLETED
    │   └─ completed_at → now()
    └─ Commit changes
```

#### 4.3. Flow Credit Transaction History

```
CreditService.add_credits() (khi payment completed):
    ├─ Update user.credits += amount
    └─ Create CreditTransaction:
        ├─ type: ADDITION
        ├─ amount: coins amount
        └─ description: "Payment transaction {transaction_id}"
```

**Note:** Hiện tại chưa có UI để xem CreditTransaction history (TODO)

#### 4.4. Files liên quan:

- `backend/api/utils/credits.py` - Credit reservation logic
- `backend/services/credit_service.py` - Credit addition service
- `backend/services/cost_estimation_service.py` - Cost mapping
- `backend/models.py` - CreditReservation, CreditTransaction models

---

## 🔀 FLOW PHỤ / NAVIGATION FLOWS

### 5. **Homepage Navigation Flow** 🏠

```
User truy cập website → [Homepage] (/)
    ↓
Hiển thị 6 Feature Cards:
    1. AI Nhảy Với Nền Từ Ảnh → /dance-image-bg
    2. AI Nhảy Với Nền Từ Video → /dance-video-bg (chưa implement)
    3. AI Thay Nhân Vật + Copy Video Quảng Cáo → /replace-ad (chưa implement)
    4. AI Thay Nhân Vật + Copy Video Review Thời Trang → /replace-fashion (chưa implement)
    5. AI Nhép Miệng + Biểu Cảm Theo Video Gốc → /lip-sync (chưa implement)
    6. AI Hát Theo Nhạc Chuẩn Giai Điệu → /sing (chưa implement)
    ↓
User click vào Feature Card → Navigate đến feature page
```

### 6. **Header Navigation Flow** 🧭

```
Header hiển thị các links (luôn có):
    ├─ Logo "Ai Dancing" → Homepage (/)
    ├─ "Tải video Tiktok Full HD Free" → /download (chưa implement)
    ├─ "Giới thiệu nhận thưởng" → /referral (chưa implement)
    └─ "Chọn Model" → /models (chưa implement)
    ↓
Nếu User đã đăng nhập (session exists):
    ├─ "Bảng Điều Khiển" → /dashboard
    ├─ "Nạp Coin" → /credits
    └─ User name/email + "Đăng xuất" button
    ↓
Nếu User chưa đăng nhập:
    └─ "Đăng nhập" button → /login
```

### 7. **Placeholder Pages** (Chưa implement) 📝

#### 7.1. Models Page (/models)
- **Status:** Placeholder (chỉ hiển thị "Tính năng đang phát triển...")
- **Purpose:** Chọn AI model để generate video (TODO)

#### 7.2. Download Page (/download)
- **Status:** Placeholder
- **Purpose:** Tải video TikTok Full HD (TODO)

#### 7.3. Referral Page (/referral)
- **Status:** Placeholder
- **Purpose:** Chương trình giới thiệu nhận thưởng (TODO)

---

## 🔄 DATA FLOW & STATE MANAGEMENT

### 8. **User State Flow**

```
Session Management (NextAuth):
    ├─ Login → Create session → Store in cookie
    ├─ Session contains: { user: { name, email, image } }
    └─ Logout → Delete session
    ↓
User Data in Backend:
    ├─ Stored in PostgreSQL: users table
    ├─ Fields: id, email, name, picture, google_id, credits
    └─ Credits updated: Payment completed, Job completed
```

### 9. **Payment State Flow**

```
Payment Lifecycle:
    PENDING → (Webhook) → COMPLETED / FAILED
    ↓
State in DB:
    ├─ Payment record: status, amount, coins, transaction_id
    ├─ CreditTransaction (when completed): ADDITION type
    └─ User.credits updated
    ↓
State in Frontend:
    ├─ QRPaymentModal: paymentStatus (loading/pending/completed/failed)
    ├─ Polling interval: Check status every 3s
    └─ Auto reload on completion
```

### 10. **Job State Flow**

```
VideoJob Lifecycle:
    PENDING → PROCESSING → COMPLETED / FAILED
    ↓
State in DB:
    ├─ VideoJob: status, progress (0-100), result_url
    ├─ CreditReservation: PENDING → COMPLETED (when job done)
    └─ User.credits deducted on completion
    ↓
State in Frontend:
    ├─ dance-image-bg page: isGenerating, progress, jobId
    ├─ Polling: Check progress every 3s
    └─ Dashboard: List all jobs with filters
```

---

## 🚨 ERROR HANDLING & EDGE CASES

### 11. **Error Scenarios**

#### 11.1. Authentication Errors
- ❌ Google OAuth failed: Log error, user vẫn có thể thử lại
- ❌ Backend auth API failed: Log error nhưng vẫn tạo session (TODO: implement validation)
- ❌ Network error: Hiển thị error message

#### 11.2. Payment Errors
- ❌ Create order failed: Alert error, status = "failed"
- ❌ Payment not found (404): Trong polling hoặc webhook
- ❌ Duplicate webhook: Idempotency check → Return early
- ❌ Amount mismatch: Validate và raise error
- ❌ User not found: Auto create temp user
- ❌ Polling timeout: Continue polling, handle network errors

#### 11.3. Credit Errors
- ❌ Insufficient credits (402): Alert user, redirect to credits page (TODO)
- ❌ Reservation failed: Return error, không tạo job
- ❌ Complete reservation failed: Job vẫn complete nhưng credits chưa deduct (TODO: implement retry)

#### 11.4. Video Generation Errors
- ❌ Missing files: Validation error, không submit
- ❌ Job creation failed: Return 500 error
- ❌ AI processing failed: Update job.status = FAILED, set error_message
- ❌ Progress polling error: Log error, tiếp tục polling

---

## 📁 FILE STRUCTURE & RESPONSIBILITIES

### Frontend Structure

```
frontend/
├── app/
│   ├── page.tsx                          # Homepage với feature cards
│   ├── login/page.tsx                    # Login page
│   ├── credits/page.tsx                  # Credits packages page
│   ├── dashboard/page.tsx                # Jobs dashboard
│   ├── dance-image-bg/page.tsx           # AI feature page
│   ├── models/page.tsx                   # Models page (placeholder)
│   ├── download/page.tsx                 # Download page (placeholder)
│   ├── referral/page.tsx                 # Referral page (placeholder)
│   └── api/                              # Next.js API routes (proxies)
│       ├── auth/[...nextauth]/route.ts   # NextAuth handler
│       ├── payments/
│       │   ├── create-order/route.ts     # Payment order proxy
│       │   ├── [transactionId]/status/route.ts  # Status polling proxy
│       │   └── webhook/route.ts          # Webhook proxy
│       ├── videos/
│       │   ├── dance-image-bg/route.ts   # Video creation proxy
│       │   └── [jobId]/progress/route.ts # Progress polling proxy
│       └── jobs/route.ts                 # Jobs list proxy
├── components/
│   ├── Header.tsx                        # Navigation header
│   ├── FeatureCard.tsx                   # Feature card component
│   └── QRPaymentModal.tsx                # Payment modal
└── lib/
    └── auth.ts                           # NextAuth config
```

### Backend Structure

```
backend/
├── main.py                               # FastAPI app entry point
├── database.py                           # SQLAlchemy engine & session
├── models.py                             # Database models
├── api/
│   └── routes/
│       ├── auth.py                       # Authentication endpoints
│       ├── payments.py                   # Payment endpoints
│       ├── videos.py                     # Video generation endpoints
│       └── jobs.py                       # Jobs listing endpoints
├── services/
│   ├── payment_service.py                # Payment business logic
│   ├── credit_service.py                 # Credit management
│   ├── video_ai_service.py               # AI processing service
│   └── cost_estimation_service.py        # Cost calculation
└── api/utils/
    └── credits.py                        # Credit reservation helpers
```

---

## 🔐 SECURITY & BEST PRACTICES

### 12. **Current Security Status**

#### ✅ Implemented:
- CORS middleware configured
- NextAuth.js session management
- SQL injection protection (SQLAlchemy ORM)
- Idempotency check for webhooks

#### ⚠️ TODO / Improvements:
- [ ] Google token verification (hiện tại chưa verify)
- [ ] Webhook signature validation
- [ ] Rate limiting cho API endpoints
- [ ] JWT/Auth token cho backend APIs (hiện tại dùng temp_user_id)
- [ ] Input validation (file size, type, etc.)
- [ ] Error logging và monitoring
- [ ] Payment gateway webhook authentication

---

## 🎯 TODO / FUTURE IMPROVEMENTS

### High Priority:
1. **Authentication:**
   - [ ] Implement proper JWT token for backend APIs
   - [ ] Verify Google OAuth token on backend
   - [ ] Replace temp_user_id với real user_id từ session

2. **Payment:**
   - [ ] Implement webhook signature validation
   - [ ] Add payment timeout (cancel after 30 minutes)
   - [ ] Payment history page

3. **AI Features:**
   - [ ] Implement actual AI API calls (hiện tại chỉ simulate)
   - [ ] Support các features còn lại (dance-video-bg, replace-ad, etc.)
   - [ ] File upload to cloud storage (S3, etc.)

### Medium Priority:
1. **UI/UX:**
   - [ ] Credit transaction history page
   - [ ] Better error messages
   - [ ] Loading states improvements
   - [ ] Mobile responsive improvements

2. **Performance:**
   - [ ] Implement WebSocket cho real-time progress (thay vì polling)
   - [ ] Image/video optimization
   - [ ] Caching strategies

3. **Features:**
   - [ ] Models selection page
   - [ ] Download TikTok video feature
   - [ ] Referral program
   - [ ] Admin dashboard

### Low Priority:
1. **DevOps:**
   - [ ] CI/CD pipeline
   - [ ] Docker containers
   - [ ] Production deployment config
   - [ ] Monitoring và logging (Sentry, etc.)

---

## 📊 DATABASE SCHEMA

### Tables:

1. **users**
   - id (PK), email (unique), name, picture, google_id, credits, created_at, updated_at

2. **payments**
   - id (PK), user_id (FK), transaction_id (unique), payment_method, amount, coins, status, qr_code_url, bank_name, account_number, transfer_content, created_at, updated_at, completed_at

3. **credit_transactions**
   - id (PK), user_id (FK), amount, type (ADDITION/DEDUCTION), description, created_at

4. **credit_reservations**
   - id (PK), user_id (FK), amount, status (PENDING/COMPLETED/CANCELLED), created_at, completed_at

5. **video_jobs**
   - id (PK), user_id (FK), feature_type, status (PENDING/PROCESSING/COMPLETED/FAILED), progress, result_url, error_message, reservation_id (FK), created_at, updated_at

---

## 🎉 KẾT LUẬN

### ✅ Flow đã implement đầy đủ:
- ✅ User Authentication (Google OAuth)
- ✅ Payment & Credit Flow (QR Code)
- ✅ AI Video Generation (1 feature: dance-image-bg)
- ✅ Dashboard (Xem jobs)
- ✅ Credit Reservation & Deduction

### ⚠️ Flow chưa implement:
- ⚠️ Models selection
- ⚠️ Download TikTok video
- ⚠️ Referral program
- ⚠️ Các AI features khác (dance-video-bg, replace-ad, etc.)

### 📝 Code quality:
- ✅ Code structure tốt, tách biệt concerns
- ✅ Service layer pattern
- ✅ Error handling cơ bản
- ⚠️ Cần improve: Auth validation, Error logging, Security
