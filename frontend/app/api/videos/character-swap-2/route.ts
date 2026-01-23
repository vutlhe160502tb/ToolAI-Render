import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file1 = formData.get('file1');
    const file2 = formData.get('file2');
    const user_id = formData.get('user_id') as string;

    if (!file1 || !file2) return NextResponse.json({ message: 'Missing files' }, { status: 400 });
    if (!user_id) return NextResponse.json({ message: 'User ID is required. Please login.' }, { status: 401 });

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const backendFormData = new FormData();
    backendFormData.append('file1', file1);
    backendFormData.append('file2', file2);
    backendFormData.append('user_id', user_id);

    const response = await fetch(`${backendUrl}/api/videos/character-swap-2`, { method: 'POST', body: backendFormData });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}

