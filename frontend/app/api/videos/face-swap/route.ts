import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const source_image = formData.get('source_image');
    const target_image = formData.get('target_image');
    const user_id = formData.get('user_id') as string;

    if (!source_image || !target_image) return NextResponse.json({ message: 'Missing files' }, { status: 400 });
    if (!user_id) return NextResponse.json({ message: 'User ID is required. Please login.' }, { status: 401 });

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const backendFormData = new FormData();
    backendFormData.append('source_image', source_image);
    backendFormData.append('target_image', target_image);
    backendFormData.append('user_id', user_id);

    const response = await fetch(`${backendUrl}/api/videos/face-swap`, { method: 'POST', body: backendFormData });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}

