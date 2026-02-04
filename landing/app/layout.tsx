import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phù Thủy AI - Tạo Video AI Chuyên Nghiệp Không Cần Biết Kỹ Thuật",
  description:
    "Model đã tinh chỉnh sẵn, nét căng 4K, cập nhật Trend mới nhất chỉ với 1 click. Dành riêng cho anh em No-Tech.",
  icons: { icon: "/AItool.jpg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="bg-background text-foreground min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
