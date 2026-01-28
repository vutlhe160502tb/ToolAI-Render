# 🔧 Hướng dẫn cấu hình Environment Variables

## Backend Environment Variables

Tạo file `.env` trong thư mục `backend/` với các biến sau:

### Database Configuration
```env
DATABASE_URL=postgresql://user:password@localhost:5432/ai_dancing
```

### Backend Configuration
```env
BACKEND_URL=http://localhost:8000
SECRET_KEY=your-secret-key-here-change-in-production
ENV=development
```

### SePay QR Code Payment Integration (BẮT BUỘC)

```env
# SePay API URL - URL của SePay payment service
SEPAY_API_URL=https://qr-moniter.up.railway.app

# Client Webhook URL - URL mà SePay sẽ gọi khi thanh toán thành công
# Development: Sử dụng localhost với ngrok hoặc tunnel để expose port
# Production: Phải là URL public accessible
CLIENT_WEBHOOK_URL=http://localhost:8000/api/payments/webhook

# Webhook Secret Key - Secret key để verify webhook signature từ SePay
# QUAN TRỌNG: Phải match với secret key được cấu hình trong SePay system
WEBHOOK_SECRET_KEY=your-webhook-secret-key-change-in-production
```

### Payment Configuration (Optional)
```env
# Payment timeout in minutes (default: 30)
PAYMENT_TIMEOUT_MINUTES=30
```

### Google OAuth (Optional - nếu sử dụng)
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### NextAuth (Optional - nếu sử dụng)
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

## Frontend Environment Variables

Tạo file `.env.local` trong thư mục `frontend/` với các biến sau:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## ⚠️ Lưu ý quan trọng

### SePay Configuration

1. **SEPAY_API_URL**: 
   - URL của SePay payment service
   - Mặc định: `https://qr-moniter.up.railway.app`
   - Không thay đổi trừ khi có hướng dẫn từ SePay

2. **CLIENT_WEBHOOK_URL**:
   - **Development**: 
     - Sử dụng ngrok hoặc cloudflare tunnel để expose localhost
     - Ví dụ: `https://abc123.ngrok.io/api/payments/webhook`
   - **Production**: 
     - Phải là URL public accessible
     - Ví dụ: `https://yourdomain.com/api/payments/webhook`
   - **QUAN TRỌNG**: SePay phải có thể gọi được URL này từ internet

3. **WEBHOOK_SECRET_KEY**:
   - Secret key để verify webhook signature từ SePay
   - Phải match với secret key được cấu hình trong SePay system
   - Không được để trống trong production

### Development Setup với ngrok

1. Cài đặt ngrok: https://ngrok.com/
2. Chạy ngrok để expose port 8000:
   ```bash
   ngrok http 8000
   ```
3. Copy URL từ ngrok (ví dụ: `https://abc123.ngrok.io`)
4. Set `CLIENT_WEBHOOK_URL` trong `.env`:
   ```env
   CLIENT_WEBHOOK_URL=https://abc123.ngrok.io/api/payments/webhook
   ```
5. Cập nhật webhook URL trong SePay dashboard (nếu có)

## 🚀 Production Deployment

Khi deploy lên production:

1. **Backend**:
   - Set `ENV=production`
   - Set `CLIENT_WEBHOOK_URL` thành domain thực tế
   - Set `WEBHOOK_SECRET_KEY` thành secret key mạnh
   - Đảm bảo webhook endpoint có thể nhận POST request từ SePay

2. **Frontend**:
   - Set `NEXT_PUBLIC_BACKEND_URL` thành backend URL thực tế
   - Set `NEXTAUTH_URL` thành frontend URL thực tế

3. **Testing**:
   - Test webhook với SePay test environment trước
   - Verify signature verification hoạt động đúng
   - Test payment flow end-to-end

## 📝 Checklist

- [ ] Backend `.env` file đã được tạo với tất cả biến cần thiết
- [ ] Frontend `.env.local` file đã được tạo
- [ ] `SEPAY_API_URL` đã được set
- [ ] `CLIENT_WEBHOOK_URL` đã được set và public accessible
- [ ] `WEBHOOK_SECRET_KEY` đã được set và match với SePay config
- [ ] Database connection string đã được cấu hình đúng
- [ ] Đã test webhook endpoint có thể nhận request từ SePay

