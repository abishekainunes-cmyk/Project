import "./globals.css";

export const metadata = {
  title: "NUNES Social Media Command Center",
  description: "Create, schedule, publish and monitor Nunes Instrumentation social media from one professional workspace."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
