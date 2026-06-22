import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  Heart,
  Download, Copy, Check,
  ArrowLeft, Loader2, AlertCircle,
} from 'lucide-react';
import { getCard, getPhotoPublicUrl } from '../lib/store';
import type { Card } from '../lib/supabase';

export default function CardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const cardUrl = window.location.href;

  useEffect(() => {
    if (!id) return;
    getCard(id)
      .then(data => {
        if (!data) { setError('Card not found.'); return; }
        setCard(data);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load card.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!card) return;
    QRCode.toDataURL(cardUrl, {
      width: 256,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    }).then(setQrDataUrl);
  }, [card, cardUrl]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
        <p className="text-sm text-neutral-400">Loading your card...</p>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertCircle className="w-12 h-12 text-neutral-300" />
        <h2 className="text-xl font-semibold text-neutral-800">Card not found</h2>
        <p className="text-neutral-500 text-sm max-w-xs">
          {error ?? 'This card may have been removed or the link is incorrect.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-2 bg-black text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-neutral-800 transition-colors"
        >
          Go home
        </button>
      </div>
    );
  }

  const photoUrl = card.photo_url
    ? getPhotoPublicUrl(card.photo_url)
    : null;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-black/5">
        <div className="max-w-xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">WishLink</span>
          </button>
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span className="text-xs font-medium text-neutral-500">Greeting card</span>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-4">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg shadow-black/5 overflow-hidden animate-scale-in">
          <div className="h-1 w-full bg-gradient-to-r from-rose-300 via-pink-400 to-rose-300" />

          {/* Title */}
          <div className="px-7 pt-7 pb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-1">A card for</p>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-neutral-950 leading-tight">
                {card.recipient}
              </h1>
            </div>
            {qrDataUrl && (
              <div className="flex-shrink-0 text-center">
                <img
                  src={qrDataUrl}
                  alt="QR code"
                  className="w-14 h-14 rounded-xl border border-neutral-100"
                />
                <p className="text-[10px] text-neutral-400 mt-1 font-medium">Scan me</p>
              </div>
            )}
          </div>

          {/* Photo */}
          {photoUrl && (
            <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
              <img
                src={photoUrl}
                alt={`Photo for ${card.recipient}`}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Message */}
          {card.message && (
            <div className="px-7 py-6 border-t border-neutral-50">
              <p className="font-display text-lg text-neutral-700 leading-relaxed whitespace-pre-wrap italic">
                "{card.message}"
              </p>
            </div>
          )}
        </div>

        {/* Share */}
        <div className="bg-white rounded-3xl shadow-lg shadow-black/5 p-7 animate-fade-in-up delay-200">
          <h3 className="font-semibold text-neutral-900 mb-1">Share this card</h3>
          <p className="text-sm text-neutral-400 mb-5">Anyone with this link or QR code can view it on any device.</p>

          <div className="flex gap-2 mb-6">
            <div className="flex-1 bg-neutral-50 rounded-xl px-4 py-3 text-sm text-neutral-400 truncate border border-neutral-100 font-mono">
              {cardUrl}
            </div>
            <button
              onClick={copyLink}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                copied
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-black text-white hover:bg-neutral-800'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {qrDataUrl && (
            <div className="flex items-center gap-5">
              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 flex-shrink-0">
                <img src={qrDataUrl} alt="QR Code" className="w-28 h-28" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-1">QR Code</p>
                <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                  Scan with any phone camera to open this card instantly.
                </p>
                <a
                  href={qrDataUrl}
                  download={`wishlink-${id}.png`}
                  className="inline-flex items-center gap-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors border border-neutral-200 px-3 py-2 rounded-xl hover:bg-neutral-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download QR
                </a>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="rounded-3xl bg-neutral-950 p-7 text-center animate-fade-in-up delay-300">
          <p className="font-display text-xl font-semibold text-white mb-1">
            Make your own card
          </p>
          <p className="text-sm text-neutral-400 mb-4">
            Create a beautiful card for someone special in minutes.
          </p>
          <button
            onClick={() => navigate('/create')}
            className="inline-flex items-center gap-2 bg-white text-black text-sm font-medium px-6 py-3 rounded-full hover:bg-neutral-100 transition-colors"
          >
            Get started free
          </button>
        </div>

        <div className="text-center pb-4">
          <div className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
            <Heart className="w-3 h-3 fill-neutral-300 text-neutral-300" />
            Made with WishLink
          </div>
        </div>
      </div>
    </div>
  );
}
