export default function HomePage() {
  return (
    <main
      style={{
        minHeight: 'calc(100vh - 56px)',
        background: '#0a0a0a',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 760, width: '100%' }}>
        <h1 style={{ margin: 0, marginBottom: 8 }}>RenderTool</h1>
        <p style={{ margin: 0, opacity: 0.8, lineHeight: 1.6 }}>
          Header phía trên sẽ hiển thị trạng thái đăng nhập. Nếu bạn chưa đăng nhập, bấm “Đăng nhập”. Khi đã đăng
          nhập, bạn sẽ thấy tên/email và nút “Đăng xuất”.
        </p>
      </div>
    </main>
  );
}

