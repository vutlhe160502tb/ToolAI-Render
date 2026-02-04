import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      id: 'phone',
      name: 'Đăng nhập bằng SĐT',
      credentials: {
        phone: { label: 'Số điện thoại', type: 'text' },
        password: { label: 'Mật khẩu', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null;
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
        const res = await fetch(`${backendUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: credentials.phone, password: credentials.password }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || 'Đăng nhập thất bại');
        }
        const user = await res.json();
        return {
          id: user.user_id,
          email: user.email || undefined,
          name: user.name,
          image: null,
          credits: user.credits,
          isAdmin: user.is_admin,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days - session sẽ hết hạn sau 7 ngày
  },
  // Tắt auto-login: không tự động refresh session
  useSecureCookies: process.env.NODE_ENV === 'production',
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && account.id_token) {
        try {
          const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
          const response = await fetch(`${backendUrl}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: account.id_token,
              email: user.email,
              name: user.name,
              avatar_url: user.image,
            }),
          });
          
          if (response.ok) {
            const backendUser = await response.json();
            // Lưu user_id vào user object để có thể dùng trong jwt callback
            (user as any).id = backendUser.user_id;
            (user as any).backendCredits = backendUser.credits;
            (user as any).isAdmin = backendUser.is_admin || false;
          } else {
            console.error('Backend auth failed:', response.statusText);
          }
        } catch (error) {
          console.error('Error syncing user:', error);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user && (user as any)?.id) {
        token.userId = (user as any).id;
        token.credits = (user as any).backendCredits ?? (user as any).credits;
        token.isAdmin = (user as any).isAdmin ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      // Lấy user_id từ JWT token và lưu vào session
      if (token.userId) {
        (session.user as any).id = token.userId as string;
      }
      if (token.credits !== undefined) {
        (session.user as any).credits = token.credits as number;
      }
      if (token.isAdmin !== undefined) {
        (session.user as any).isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

