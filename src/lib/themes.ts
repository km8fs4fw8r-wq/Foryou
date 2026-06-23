export type CardTheme = 'classic' | 'rose' | 'midnight' | 'forest';

export interface CardThemeOption {
  id: CardTheme;
  name: string;
  description: string;
  preview: string;
  page: string;
  card: string;
  accent: string;
  envelope: string;
}

export const CARD_THEMES: CardThemeOption[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Warm ivory and understated gold',
    preview: 'from-amber-50 to-stone-100',
    page: 'bg-stone-100',
    card: 'bg-[#fffdf8]',
    accent: 'from-amber-300 via-yellow-500 to-amber-300',
    envelope: 'from-[#ead8b8] to-[#c9a879]',
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Soft blush for heartfelt moments',
    preview: 'from-rose-100 to-pink-200',
    page: 'bg-rose-50',
    card: 'bg-[#fff8fa]',
    accent: 'from-rose-300 via-pink-500 to-rose-300',
    envelope: 'from-rose-200 to-pink-300',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep blue with a starlit glow',
    preview: 'from-slate-800 to-indigo-950',
    page: 'bg-slate-950',
    card: 'bg-slate-900 text-white',
    accent: 'from-indigo-400 via-violet-300 to-indigo-400',
    envelope: 'from-indigo-800 to-slate-950',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Quiet greens and natural warmth',
    preview: 'from-emerald-100 to-stone-200',
    page: 'bg-emerald-50',
    card: 'bg-[#fbfdf8]',
    accent: 'from-emerald-300 via-green-600 to-emerald-300',
    envelope: 'from-emerald-300 to-green-700',
  },
];

export function getCardTheme(theme?: string | null): CardThemeOption {
  return CARD_THEMES.find(option => option.id === theme) ?? CARD_THEMES[0];
}
