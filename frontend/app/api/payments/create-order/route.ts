// NOTE: Nếu chưa `npm install` thì TypeScript có thể báo thiếu typings của Next/Node.
// Những khai báo dưới đây chỉ để giảm noise trong editor; khi cài deps đầy đủ sẽ không cần.
// @ts-ignore
import { NextRequest, NextResponse } from 'next/server';

declare const process: { env: Record<string, string | undefined> };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.BACKEND_URL ||
      'http://localhost:8000';

    const response = await fetch(`${backendUrl}/api/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

