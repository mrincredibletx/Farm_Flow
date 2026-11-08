import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Smart Agricultural Drainage System | Phase I MVP',
  description:
    'Terrain intelligence and waterlogging vulnerability detection system for agricultural fields. Developed by Rakesh Bangra (B.Tech CSE, UEM Jaipur).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-brand-void text-slate-100 min-h-screen overflow-hidden antialiased">
        {children}
      </body>
    </html>
  );
}

