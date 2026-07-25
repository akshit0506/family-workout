import type { Metadata, Viewport } from "next";
import { Anton, Geist, Roboto_Slab } from "next/font/google";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { APP_DESCRIPTION, APP_NAME, APP_SHORT_NAME } from "@/lib/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

const robotoSlab = Roboto_Slab({
  variable: "--font-roboto-slab",
  weight: "700",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  appleWebApp: {
    // Hides Safari's chrome when launched from the home screen and lets
    // the app draw its own content under the status bar — "black-translucent"
    // is what gives the edge-to-edge, native-feeling top edge; AppShell/
    // Masthead compensate with safe-area-inset-top padding so nothing
    // renders underneath the notch/Dynamic Island itself.
    capable: true,
    title: APP_SHORT_NAME,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Lets the page extend into the safe-area insets (notch, Dynamic Island,
  // home indicator) instead of the OS reserving that space itself — the
  // safe-area-inset-* CSS env() variables only carry real values once this
  // is set to "cover". See AppShell/Masthead/NavBar for the padding that
  // then keeps content clear of those areas.
  viewportFit: "cover",
  themeColor: "#f1ece1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${anton.variable} ${robotoSlab.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <OfflineBanner />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
