import type { Card } from './types';

const STORAGE_KEY = 'wishlink_cards';

function readAll(): Record<string, Card> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function saveCard(card: Card): void {
  const all = readAll();
  all[card.id] = card;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function loadCard(id: string): Card | null {
  return readAll()[id] ?? null;
}
