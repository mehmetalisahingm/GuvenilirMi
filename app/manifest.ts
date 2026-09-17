import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GüvenilirMi",
    short_name: "GüvenilirMi",
    description: "Web sitelerini AI kullanmadan, açıklanabilir teknik sinyallerle analiz et.",
    start_url: "/",
    display: "standalone",
    background_color: "#07100c",
    theme_color: "#07100c",
    lang: "tr",
  };
}
