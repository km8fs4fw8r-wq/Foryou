import type { Card } from './types';

const STORAGE_KEY = 'wishlink_cards';

function readAll(): Record<string, Card> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

// Compress image file to a JPEG data URL capped at maxDimension px.
// Keeps photos well within localStorage limits (~200-400KB each).
export function compressImage(file: File, maxDimension = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, maxDimension / Math.max(w, h));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas unavailable')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Failed to load image')); };
    img.src = objectUrl;
  });
}

export function saveCard(card: Card): void {
  try {
    const all = readAll();
    all[card.id] = card;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    // QuotaExceededError — re-throw with a clear message
    throw new Error('Not enough storage space. Try using smaller photos.');
  }
}

export function loadCard(id: string): Card | null {
  return readAll()[id] ?? null;
}
