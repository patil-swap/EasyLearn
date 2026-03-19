import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EasyLearn | AI Book Assistant",
  description: "Intelligent book analysis and learning assistant powered by RAG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-[#F8F9FA] text-[#202124]`}>
        {children}
      </body>
    </html>
  );
}
