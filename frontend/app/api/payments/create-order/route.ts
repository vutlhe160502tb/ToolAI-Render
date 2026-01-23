import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { package_id, amount, coins, user_id } = body;

    // Better validation with detailed error messages
    if (package_id === undefined || package_id === null) {
      return NextResponse.json(
        { message: 'Missing required field: package_id' },
        { status: 400 }
      );
    }
    if (amount === undefined || amount === null || amount <= 0) {
      return NextResponse.json(
        { message: 'Missing or invalid field: amount (must be > 0)' },
        { status: 400 }
      );
    }
    if (coins === undefined || coins === null || coins <= 0) {
      return NextResponse.json(
        { message: 'Missing or invalid field: coins (must be > 0)' },
        { status: 400 }
      );
    }
    if (!user_id || user_id.trim() === '') {
      return NextResponse.json(
        { message: 'Missing or invalid field: user_id' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:8000';
    
    const response = await fetch(`${backendUrl}/api/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        package_id,
        amount,
        coins,
        user_id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create payment order' }));
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API route error:', error);
    // If it's a JSON parsing error, return better message
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

