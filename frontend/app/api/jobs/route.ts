import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const user_id = searchParams.get('user_id'); // Lấy từ query param

    if (!user_id) {
      return NextResponse.json(
        { message: 'user_id is required', jobs: [] },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:8000';
    const url = `${backendUrl}/api/jobs?user_id=${user_id}${status && status !== 'all' ? `&status=${status}` : ''}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If backend is not available, return empty jobs
        if (response.status === 404 || response.status === 500) {
          return NextResponse.json({ jobs: [] });
        }
        return NextResponse.json(
          { message: 'Failed to fetch jobs', jobs: [] },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      // Backend might not be running, return empty jobs
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

