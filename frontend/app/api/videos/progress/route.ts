import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/videos/progress?jobId=xxx
 * Tránh dùng dynamic segment [jobId] có thể gây 404 với Next.js 16 / Turbopack.
 */
export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get('jobId');
    if (!jobId) {
      return NextResponse.json(
        { message: 'jobId is required' },
        { status: 400 }
      );
    }

    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');
    const url = `${backendUrl}/api/videos/${encodeURIComponent(jobId)}/progress`;
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const text = await response.text();
      let body: unknown = { message: 'Failed to get progress' };
      try {
        body = JSON.parse(text);
      } catch {
        // ignore
      }
      return NextResponse.json(body, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Progress route error:', error);
    return NextResponse.json(
      { message: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
