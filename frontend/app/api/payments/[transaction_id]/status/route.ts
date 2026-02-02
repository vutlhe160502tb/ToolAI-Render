// NOTE: Nếu chưa `npm install` thì TypeScript có thể báo thiếu typings của Next/Node.
// Những khai báo dưới đây chỉ để giảm noise trong editor; khi cài deps đầy đủ sẽ không cần.
// @ts-ignore
import { NextRequest, NextResponse } from 'next/server';

declare const process: { env: Record<string, string | undefined> };

export async function GET(
  _request: NextRequest,
  context: { params: { transaction_id: string } },
) {
  try {
    const transactionId = context.params.transaction_id;

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.BACKEND_URL ||
      'http://localhost:8000';

    const response = await fetch(
      `${backendUrl}/api/payments/${encodeURIComponent(transactionId)}/status`,
      { method: 'GET' },
    );

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

