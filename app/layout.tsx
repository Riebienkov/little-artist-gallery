import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/components/LanguageContext';
import CosmicBackground from '@/components/CosmicBackground';

export const metadata: Metadata = {
  title: 'Казкова майстерня • Галерея художниці Тані',
  description: 'Персональна виставка щоденних малюнків, інтерактивні пазли, AI-арт та книга теплих побажань 🎨✨',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" className="dark">
      <body className="min-h-full flex flex-col bg-[#070512] text-slate-100 relative selection:bg-pink-500 selection:text-white">
        <CosmicBackground />
        <div className="relative z-10 flex-1 flex flex-col">
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </div>
      </body>
    </html>
  );
}
