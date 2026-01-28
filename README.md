# AI Dancing - AI Video Generation App

Ứng dụng tạo video AI với nhiều tính năng đa dạng.

## 🚀 Quick Start

### Cài đặt dependencies

```bash
npm run install:all
```

### Chạy cả Frontend và Backend

```bash
npm run dev
```

Hoặc chạy riêng lẻ:

```bash
# Frontend (Next.js) - http://localhost:3000
npm run dev:frontend

# Backend (FastAPI) - http://localhost:8000
npm run dev:backend
```

## 📁 Cấu trúc Project

```
.
├── frontend/          # Next.js frontend
├── backend/           # Python FastAPI backend
└── FLOW_DOCUMENTATION.md
```

## ⚙️ Setup

### Frontend

1. Tạo file `.env.local` trong `frontend/`:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
BACKEND_URL=http://localhost:8000
```

2. Cài đặt dependencies:
```bash
cd frontend
npm install
```

### Backend

1. Tạo file `.env` trong `backend/`:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ai_dancing

# Backend Configuration
BACKEND_URL=http://localhost:8000
SECRET_KEY=your-secret-key-here
ENV=development

# SePay QR Code Payment Integration (REQUIRED)
SEPAY_API_URL=https://qr-moniter.up.railway.app
CLIENT_WEBHOOK_URL=http://localhost:8000/api/payments/webhook
WEBHOOK_SECRET_KEY=your-webhook-secret-key

# Payment Timeout (optional, default: 30 minutes)
PAYMENT_TIMEOUT_MINUTES=30
```

**Lưu ý quan trọng về SePay:**
- `SEPAY_API_URL`: URL của SePay payment service (mặc định: https://qr-moniter.up.railway.app)
- `CLIENT_WEBHOOK_URL`: URL mà SePay sẽ gọi khi thanh toán thành công
  - Development: Sử dụng localhost với ngrok/tunnel để expose port
  - Production: Phải là URL public accessible (ví dụ: https://yourdomain.com/api/payments/webhook)
- `WEBHOOK_SECRET_KEY`: Secret key để verify webhook signature (phải match với SePay config)

2. Setup database:
```bash
# Tạo PostgreSQL database
createdb ai_dancing
```

3. Cài đặt dependencies:
```bash
cd backend
pip install -r requirements.txt
```

## 🎯 Features

- ✅ AI Nhảy Với Nền Từ Ảnh
- ✅ AI Nhảy Với Nền Từ Video
- ✅ AI Thay Nhân Vật + Copy Video Quảng Cáo
- ✅ AI Thay Nhân Vật + Copy Video Review Thời Trang
- ✅ AI Nhép Miệng + Biểu Cảm Theo Video Gốc
- ✅ AI Hát Theo Nhạc Chuẩn Giai Điệu
- ✅ Payment & Credit System
- ✅ Google OAuth Authentication

## 📚 Documentation

Xem `FLOW_DOCUMENTATION.md` để hiểu rõ flow của ứng dụng.

