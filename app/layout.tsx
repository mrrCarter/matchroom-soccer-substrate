import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MatchRoom Soccer Substrate",
  description:
    "Verified soccer preparation room for upcoming fixtures, built on real schedule and StatsBomb evidence data."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
