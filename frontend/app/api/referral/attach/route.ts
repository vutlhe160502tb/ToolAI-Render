import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const user_id = body?.user_id as string | undefined;
    const referral_code = body?.referral_code as string | undefined;

    if (!user_id || !referral_code) {
      return NextResponse.json(
        { message: 'user_id and referral_code are required' },
        { status: 400 },
      );
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.BACKEND_URL ||
      'http://localhost:8000';

    const response = await fetch(`${backendUrl}/api/referral/attach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, referral_code }),
    });

    const data = await response
      .json()
      .catch(() => ({ message: 'Failed to attach referral' }));

    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error('API route error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { message },
      { status: 500 },
    );
  }
}

