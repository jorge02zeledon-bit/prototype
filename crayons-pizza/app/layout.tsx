import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";
import { STORE } from "@/lib/menu";

export const metadata: Metadata = {
  title: { default: STORE.name, template: `%s | ${STORE.name}` },
  description: `${STORE.name}: cheese and pepperoni slices, six dollars each. Order online, pick up hot at ${STORE.address}.`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,400..900;1,62..125,400..900&display=swap"
        />
      </head>
      <body>
        <CartProvider>
          <a className="skip" href="#menu">Skip to menu</a>
          <Header />
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
