import "./globals.css";

export const metadata = {
  title: "IndiaMART AI Content & Catalog Studio | Production Demo",
  description: "Next.js Generative AI Catalog Engine, technical spec extraction, SEO copywriting, and automated PDF brochure generation.",
  keywords: "IndiaMART, Generative AI, Next.js, PDF Generator, Catalog Automation, AI Engineering, Abishek Pranav",
  authors: [{ name: "Abishek Pranav G V" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
