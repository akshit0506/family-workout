import type { MetadataRoute } from "next";
import { APP_DESCRIPTION, APP_NAME, APP_SHORT_NAME } from "@/lib/config";

// Served automatically at /manifest.webmanifest, with Next.js injecting the
// <link rel="manifest"> tag — no manual wiring needed in layout.tsx. See
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: APP_NAME,
    short_name: APP_SHORT_NAME,
    description: APP_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Matches globals.css's --paper/--rust tokens (see DESIGN.md) — chosen
    // so the OS splash screen and status bar/task-switcher chrome blend
    // with the app's own background instead of flashing a mismatched color
    // before the page's CSS takes over.
    background_color: "#f1ece1",
    theme_color: "#f1ece1",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
