import type { Metadata } from "next";
import "./globals.css";

// Using system fonts as fallback due to build environment restrictions
// In production, these would be replaced with Geist fonts from Google Fonts
const fontVariables = "font-sans";

export const metadata: Metadata = {
  title: "Collegiate Inbox Navigator - AI Academic Assistant",
  description: "AI-powered academic assistant for college students. Never miss deadlines, assignments, or important emails.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fontVariables} antialiased`}>
        {children}
      </body>
    </html>
  );
}
