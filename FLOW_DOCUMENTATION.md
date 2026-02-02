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

