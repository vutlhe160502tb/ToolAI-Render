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
DATABASE_URL=postgresql://user:password@localhost:5432/ai_dancing
BACKEND_URL=http://localhost:8000
SECRET_KEY=your-secret-key-here
```

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

