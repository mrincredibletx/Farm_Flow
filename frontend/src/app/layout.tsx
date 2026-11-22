import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Farm Flow | Smart Agricultural Drainage System',
  description:
    'Terrain intelligence and precision agricultural drainage system. Developed by Rakesh Bangra & Sampat Singh Sekhawat (UEM Jaipur).',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-brand-void text-slate-100 min-h-screen overflow-hidden antialiased select-none">
        {children}
      </body>
    </html>
  );
}

