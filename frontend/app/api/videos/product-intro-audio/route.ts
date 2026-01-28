import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const audio = formData.get('audio');
    const quality = formData.get('quality') as string | null;
    const user_id = formData.get('user_id') as string;

    if (!file || !audio) return NextResponse.json({ message: 'Missing files' }, { status: 400 });
    if (!user_id) return NextResponse.json({ message: 'User ID is required. Please login.' }, { status: 401 });

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('audio', audio);
    if (quality) backendFormData.append('quality', quality);
    backendFormData.append('user_id', user_id);

    const response = await fetch(`${backendUrl}/api/videos/product-intro-audio`, { method: 'POST', body: backendFormData });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}

