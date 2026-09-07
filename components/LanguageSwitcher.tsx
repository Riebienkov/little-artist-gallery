'use client';

import { useLanguage } from './LanguageContext';
import { Language } from '@/lib/i18n';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'uk', label: 'УКР', flag: '🇺🇦' },
    { code: 'de', label: 'DEU', flag: '🇩🇪' },
    { code: 'en', label: 'ENG', flag: '🇬🇧' },
  ];

  return (
    <div className="flex items-center bg-slate-900/80 backdrop-blur-md p-0.5 rounded-full border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]">
      {languages.map((item) => (
        <button
          key={item.code}
          onClick={() => setLang(item.code)}
          type="button"
          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
            lang === item.code
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs scale-102 ring-1 ring-white/20'
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
          }`}
          title={item.label}
        >
          <span className="text-xs">{item.flag}</span>
          <span className="text-[11px]">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
