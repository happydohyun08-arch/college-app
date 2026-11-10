import type { Metadata } from "next";
import Link from "next/link";
import Nav from "./nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "대학 지원 노트",
  description: "고등학생용 미국 대학 지원 관리. 자료는 내 브라우저에만 저장돼요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Nav />
        <main>{children}</main>
        <footer>
          자료는 이 브라우저에만 저장돼요. 브라우저 기록을 지우면 사라지니 <b>내보내기</b>로 백업하세요. ·{" "}
          <Link href="/privacy/">개인정보 안내</Link>
        </footer>
      </body>
    </html>
  );
}
