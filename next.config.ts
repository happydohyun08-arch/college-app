import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // GitHub Pages는 /<저장소 이름> 아래에서 열린다. 배포 워크플로가 BASE_PATH를 넣는다.
  basePath: process.env.BASE_PATH || "",
  trailingSlash: true,
};

export default nextConfig;
