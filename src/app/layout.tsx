import type { Metadata, Viewport } from "next";
import "@fontsource/google-sans-flex/400.css";
import "@fontsource/google-sans-flex/500.css";
import "@fontsource/google-sans-flex/700.css";
import "@fontsource/google-sans-flex/800.css";
import "@fontsource/google-sans-code/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "IC5 Labs", template: "%s · IC5 Labs" },
  description: "Product Builder Experience: AI-assisted product management native to ServiceNow. Turn customer signals into evidence-backed needs, live roadmaps, and releases that close the loop.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#00165E" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
