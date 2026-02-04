import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const res = await fetch(`${backendUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) console.error('[Register] Backend:', res.status, data);
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    const err = e as { cause?: { code?: string } };
    const isRefused = err?.cause?.code === 'ECONNREFUSED';
    console.error('Register proxy error:', e);
    return NextResponse.json(
      { detail: isRefused ? 'Backend chưa chạy. Khởi động: cd backend && python -m uvicorn main:app --reload --port 8000' : 'Lỗi kết nối backend' },
      { status: 500 }
    );
  }
}
