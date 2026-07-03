import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "오늘 뭐 해먹지",
    short_name: "뭐해먹지",
    description: "오늘 먹을 집밥 메뉴를 추천해드려요",
    start_url: "/",
    display: "standalone",
    background_color: "#e9f3ff",
    theme_color: "#e9f3ff",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
