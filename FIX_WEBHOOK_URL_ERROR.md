# 🔧 Fix Lỗi: "clientWebhookUrl must be a URL address"

## ❌ Lỗi

```
Lỗi tạo đơn thanh toán: Lỗi kết nối SePay: SePay API returned status 400: 
{"error":"Bad Request","message":["clientWebhookUrl must be a URL address"],"statusCode":400}
```

## 🔍 Nguyên nhân

SePay API không thể gọi được `localhost` URL từ internet. `CLIENT_WEBHOOK_URL` hiện tại đang là:
```
http://localhost:8000/api/payments/webhook
```

Đây là URL local, không thể truy cập từ internet.

## ✅ Giải pháp

### Option 1: Sử dụng ngrok (Khuyến nghị cho Development)

1. **Cài đặt ngrok:**
   - Download từ: https://ngrok.com/
   - Hoặc dùng package manager:
     ```bash
     # Windows (choco)
     choco install ngrok
     
     # macOS (homebrew)
     brew install ngrok
     
     # Linux
     wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
     tar xvzf ngrok-v3-stable-linux-amd64.tgz
     sudo mv ngrok /usr/local/bin
     ```

2. **Chạy ngrok để expose port 8000:**
   ```bash
   ngrok http 8000
   ```

3. **Copy URL từ ngrok:**
   - Ngrok sẽ hiển thị URL dạng: `https://abc123.ngrok.io`
   - Copy URL này

4. **Cập nhật `.env` trong `backend/`:**
   ```env
   CLIENT_WEBHOOK_URL=https://abc123.ngrok.io/api/payments/webhook
   ```

5. **Restart backend server:**
   ```bash
   cd backend
   python -m uvicorn main:app --reload
   ```

### Option 2: Sử dụng Public URL (Production)

Nếu bạn đã deploy backend lên server:

1. **Cập nhật `.env` trong `backend/`:**
   ```env
   CLIENT_WEBHOOK_URL=https://yourdomain.com/api/payments/webhook
   ```

2. **Đảm bảo:**
   - URL có thể truy cập từ internet
   - Endpoint `/api/payments/webhook` có thể nhận POST request
   - CORS đã được cấu hình đúng

### Option 3: Sử dụng Cloudflare Tunnel (Alternative)

1. **Cài đặt cloudflared:**
   ```bash
   # Download từ: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
   ```

2. **Chạy tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:8000
   ```

3. **Copy URL và cập nhật `.env`**

## 🧪 Kiểm tra cấu hình

Chạy script kiểm tra:

```bash
cd backend
python scripts/check_sepay_config.py
```

Script sẽ:
- ✅ Kiểm tra `SEPAY_API_URL`
- ✅ Kiểm tra `CLIENT_WEBHOOK_URL` format
- ✅ Cảnh báo nếu dùng localhost
- ✅ Hướng dẫn cách fix

## 📝 Checklist

- [ ] Đã cài đặt ngrok hoặc có public URL
- [ ] Đã cập nhật `CLIENT_WEBHOOK_URL` trong `.env`
- [ ] URL không phải localhost
- [ ] URL có thể truy cập từ internet (test bằng browser)
- [ ] Đã restart backend server
- [ ] Đã chạy `check_sepay_config.py` và pass

## ⚠️ Lưu ý

1. **Ngrok free plan:**
   - URL sẽ thay đổi mỗi lần restart ngrok
   - Cần cập nhật lại `.env` mỗi lần

2. **Ngrok paid plan:**
   - Có thể dùng custom domain
   - URL không đổi

3. **Production:**
   - **KHÔNG** dùng ngrok
   - Phải dùng public URL thực tế
   - Đảm bảo HTTPS

## 🔗 Tài liệu tham khảo

- [SePay Integration Guide](./SEPAY_INTEGRATION.md)
- [Environment Setup](./ENV_SETUP.md)
- [Ngrok Documentation](https://ngrok.com/docs)

