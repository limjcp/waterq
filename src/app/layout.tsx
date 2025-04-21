import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"], // Add the weights you need
  variable: "--font-roboto", // Optional if you want to use it as a CSS variable
  display: "swap",
});

export const metadata: Metadata = {

  title: "GSCWD Queuing System",
  description: "General Santos City Water District Queueing System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <SessionProvider>
        <body className={roboto.className}>{children}</body>
      </SessionProvider>
    </html>
  );
}
