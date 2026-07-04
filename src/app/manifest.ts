import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Concert Chaussettes",
    short_name: "Concert Chaussettes",
    description: "Concerts privés chez l'habitant — mettez en relation organisateurs et groupes de musique.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f97316",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
