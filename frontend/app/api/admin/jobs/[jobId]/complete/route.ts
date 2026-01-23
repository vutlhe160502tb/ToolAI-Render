import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    if (!jobId) {
      return NextResponse.json(
        { message: 'Job ID is required' },
        { status: 400 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const adminNotes = formData.get('admin_notes') as string | null;

    if (!file) {
      return NextResponse.json(
        { message: 'File is required' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:8000';
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    if (adminNotes) {
      backendFormData.append('admin_notes', adminNotes);
    }

    console.log(`[Admin Complete] Job ID: ${jobId}, Backend URL: ${backendUrl}/api/jobs/${jobId}/complete-with-file`);
    
    const response = await fetch(`${backendUrl}/api/jobs/${jobId}/complete-with-file`, {
      method: 'POST',
      body: backendFormData,
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      const text = await response.text();
      console.error(`[Admin Complete] Response is not JSON: ${text}`);
      return NextResponse.json(
        { message: text || 'Failed to complete job' },
        { status: response.status }
      );
    }
    
    console.log(`[Admin Complete] Response status: ${response.status}, data:`, data);
    
    if (!response.ok) {
      return NextResponse.json(
        { message: data.detail || data.message || 'Failed to complete job' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

