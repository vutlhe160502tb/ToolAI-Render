'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

function displayName(name?: string | null, email?: string | null) {
  if (name && name.trim()) return name;
  if (email && email.trim()) return email;
  return 'User';
}

export function Header() {
  const { data: session, status } = useSession();
  const user = session?.user as any;

  const name = user?.name as string | undefined;
  const email = user?.email as string | undefined;
  const credits = user?.credits as number | undefined;

  const isAuthed = status === 'authenticated';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.10)',
        background: '#0a0a0a',
        color: 'white',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <Link href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 800 }}>
          RenderTool
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {status === 'loading' ? (
            <span style={{ fontSize: 13, opacity: 0.8 }}>Đang tải...</span>
          ) : isAuthed ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{displayName(name, email)}</span>
                <span style={{ fontSize: 12, opacity: 0.75 }}>
                  {email ?? ''}
                  {typeof credits === 'number' ? ` • Credits: ${credits}` : ''}
                </span>
              </div>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <Link
              href="/login"
              style={{
                padding: '8px 10px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.25)',
                color: 'white',
                textDecoration: 'none',
              }}
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

