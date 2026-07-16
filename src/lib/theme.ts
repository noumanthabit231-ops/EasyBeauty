export interface FontOption {
  key: string;
  label: string;
  stack: string;
}

// Все эти шрифты поддерживают кириллицу и подключены в src/app/layout.tsx
export const FONTS: FontOption[] = [
  { key: 'inter', label: 'Inter — современный', stack: "'Inter', system-ui, sans-serif" },
  { key: 'montserrat', label: 'Montserrat — чистый', stack: "'Montserrat', sans-serif" },
  { key: 'cormorant', label: 'Cormorant — изящный, как ESTET', stack: "'Cormorant Garamond', serif" },
  { key: 'forum', label: 'Forum — премиальный', stack: "'Forum', serif" },
  { key: 'prata', label: 'Prata — модный журнальный', stack: "'Prata', serif" },
  { key: 'playfair', label: 'Playfair Display — элегантный', stack: "'Playfair Display', serif" },
  { key: 'lora', label: 'Lora — книжный', stack: "'Lora', serif" },
  { key: 'ptserif', label: 'PT Serif — классический', stack: "'PT Serif', serif" },
  { key: 'comfortaa', label: 'Comfortaa — округлый', stack: "'Comfortaa', cursive" },
];

export function fontStack(key: string | undefined | null): string {
  return FONTS.find((f) => f.key === key)?.stack ?? FONTS[0].stack;
}
