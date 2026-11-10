"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { exportFile, importFile } from "@/lib/store";

const LINKS = [["/", "내 정보"], ["/schools/", "학교"], ["/essays/", "에세이"], ["/privacy/", "개인정보"]];

export default function Nav() {
  const path = usePathname();
  return (
    <nav>
      <b>대학 지원 노트</b>
      {LINKS.map(([href, label]) => (
        <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>{label}</Link>
      ))}
      <span className="grow" />
      <button onClick={exportFile}>내보내기</button>
      <label className="button">
        가져오기
        <input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
      </label>
    </nav>
  );
}
