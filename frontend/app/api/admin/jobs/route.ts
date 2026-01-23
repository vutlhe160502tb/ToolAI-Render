import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:8000';
    const url = `${backendUrl}/api/jobs?admin=true&status=${status}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return NextResponse.json(
          { message: 'Failed to fetch jobs', jobs: [] },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      console.error('Backend fetch error:', fetchError);
      return NextResponse.json({ jobs: [] });
    }
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error', jobs: [] },
      { status: 500 }
    );
  }
}

