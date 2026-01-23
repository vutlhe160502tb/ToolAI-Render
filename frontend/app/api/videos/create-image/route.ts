import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const prompt = formData.get('prompt') as string | null;
    const user_id = formData.get('user_id') as string;

    if (!file) {
      return NextResponse.json(
        { message: 'Missing file' },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { message: 'User ID is required. Please login.' },
        { status: 401 }
      );
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    if (prompt) backendFormData.append('prompt', prompt);
    backendFormData.append('user_id', user_id);

    const response = await fetch(`${backendUrl}/api/videos/create-image`, {
      method: 'POST',
      body: backendFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

