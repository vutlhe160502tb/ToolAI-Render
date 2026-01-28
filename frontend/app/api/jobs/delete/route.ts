import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_ids, user_id } = body as { job_ids: string[]; user_id: string };

    if (!user_id || !Array.isArray(job_ids) || job_ids.length === 0) {
      return NextResponse.json(
        { message: 'user_id and non-empty job_ids are required' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/jobs/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_ids, user_id }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        data?.detail || { message: 'Failed to delete jobs' },
        { status: response.status }
      );
    }
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API delete jobs error:', error);
    return NextResponse.json(
      { message: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
