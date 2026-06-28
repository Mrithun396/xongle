import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CartProvider } from "@/app/context/CartContext";
import { AuthProvider } from "@/app/context/AuthContext";
import Footer from "@/app/components/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Xongle - Buy together. Save together.",
  description: "Join a group buying app for India where friends and family shop together and unlock discounts. Shared via WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <CartProvider>
            {children}
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}