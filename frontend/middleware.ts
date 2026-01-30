import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Hiện tại không chặn login theo URL nữa.
// Logic bắt login sẽ đặt ở UI (click button/link) theo yêu cầu.
export default function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Match nothing (disable middleware)
  matcher: ['/__never__'],
};

