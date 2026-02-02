// NOTE: Trong môi trường chưa cài dependencies (chưa có node_modules),
// TypeScript có thể báo "Cannot find module 'next-auth'". Khi `npm install`
// đầy đủ, dòng import này sẽ resolve bình thường.
// @ts-ignore
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

