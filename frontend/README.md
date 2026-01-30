# Frontend (Next.js)

## Chạy local (khuyến nghị)

Repo dùng **npm workspaces** để tránh trùng `node_modules` giữa `frontend/` và `landing/`.

```bash
npm install
npm --workspace frontend run dev
```

Mặc định chạy tại `http://localhost:3000`.

## Build/Start

```bash
npm --workspace frontend run build
npm --workspace frontend run start
```
