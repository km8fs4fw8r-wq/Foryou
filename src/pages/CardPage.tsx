import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  Heart,
  Download, Copy, Check,
  ArrowLeft, Loader2, AlertCircle, Music, Volume2, VolumeX, Mic,
} from 'lucide-react';
import { getCard, getPhotoPublicUrl, getVoicePublicUrl } from '../lib/store';
import type { Card } from '../lib/supabase';
import { getCardTheme } from '../lib/themes';

const PRODUCTION_SITE_URL = 'https://foryou-foryouu.vercel.app';

export default function CardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [envelopeState, setEnvelopeState] = useState<'sealed' | 'opening' | 'open'>('sealed');
  const [musicOn, setMusicOn] = useState(false);
  const [musicError, setMusicError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  const cardUrl = id
    ? `${PRODUCTION_SITE_URL}/card/${encodeURIComponent(id)}`
    : PRODUCTION_SITE_URL;

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

  useEffect(() => {
    return () => {
      oscillatorsRef.current.forEach(oscillator => oscillator.stop());
      void audioContextRef.current?.close();
    };
  }, []);

  const startAmbientMusic = async () => {
    try {
      setMusicError(null);

      if (audioContextRef.current) {
        await audioContextRef.current.resume();
        musicGainRef.current?.gain.cancelScheduledValues(audioContextRef.current.currentTime);
        musicGainRef.current?.gain.setTargetAtTime(
          0.085,
          audioContextRef.current.currentTime,
          0.8,
        );
        setMusicOn(true);
        return;
      }

      const context = new AudioContext();
      await context.resume();

      const masterGain = context.createGain();
      masterGain.gain.setValueAtTime(0.0001, context.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.085, context.currentTime + 3.5);
      masterGain.connect(context.destination);

      const notes = [130.81, 164.81, 196];
      const oscillators = notes.map((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = index === 0 ? 'sine' : 'triangle';
        oscillator.frequency.value = frequency;
        gain.gain.value = index === 0 ? 0.55 : 0.16;
        oscillator.connect(gain);
        gain.connect(masterGain);
        oscillator.start();
        return oscillator;
      });

      audioContextRef.current = context;
      musicGainRef.current = masterGain;
      oscillatorsRef.current = oscillators;
      setMusicOn(true);
    } catch (err) {
      console.error('[Ambient music] Failed to start', err);
      setMusicOn(false);
      setMusicError('Music could not start on this device. Tap the sound button to retry.');
    }
  };

  const openEnvelope = () => {
    if (envelopeState !== 'sealed') return;
    setEnvelopeState('opening');
    void startAmbientMusic();
    window.setTimeout(() => setEnvelopeState('open'), 2600);
  };

  const toggleMusic = async () => {
    const context = audioContextRef.current;
    if (!context) {
      await startAmbientMusic();
      return;
    }

    if (musicOn) {
      musicGainRef.current?.gain.setTargetAtTime(0.0001, context.currentTime, 0.5);
      window.setTimeout(() => { void context.suspend(); }, 900);
      setMusicOn(false);
    } else {
      await context.resume();
      musicGainRef.current?.gain.setTargetAtTime(0.085, context.currentTime, 0.8);
      setMusicOn(true);
    }
  };

  const lowerAmbientMusic = () => {
    const context = audioContextRef.current;
    if (!context || !musicOn) return;
    musicGainRef.current?.gain.setTargetAtTime(0.006, context.currentTime, 0.25);
  };

  const restoreAmbientMusic = () => {
    const context = audioContextRef.current;
    if (!context || !musicOn) return;
    musicGainRef.current?.gain.setTargetAtTime(0.085, context.currentTime, 0.5);
  };

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
  const voiceUrl = card.voice_url
    ? getVoicePublicUrl(card.voice_url)
    : null;
  const theme = getCardTheme(card.theme);
  const isDarkTheme = theme.id === 'midnight';

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${theme.page}`}>
      {envelopeState !== 'open' && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-gradient-to-b ${theme.preview} px-6`}>
          <div className="absolute inset-0 envelope-glow" />
          <button
            type="button"
            onClick={openEnvelope}
            disabled={envelopeState === 'opening'}
            className="relative w-full max-w-sm text-center focus:outline-none"
            aria-label={`Open card for ${card.recipient}`}
          >
            <div className={`envelope-scene ${envelopeState === 'opening' ? 'is-opening' : ''}`}>
              <div className={`envelope-card-preview ${theme.card}`}>
                <Heart className="w-5 h-5 mx-auto mb-2 text-rose-400 fill-rose-400" />
                <p className={`font-display text-xl ${isDarkTheme ? 'text-white' : 'text-neutral-800'}`}>
                  For {card.recipient}
                </p>
              </div>
              <div className={`envelope-back bg-gradient-to-br ${theme.envelope}`} />
              <div className={`envelope-letter-pocket bg-gradient-to-t ${theme.envelope}`} />
              <div className={`envelope-flap bg-gradient-to-br ${theme.envelope}`} />
              <div className="envelope-seal">
                <Heart className="w-5 h-5 fill-white text-white" />
              </div>
            </div>
            <div className={`mt-12 transition-opacity duration-500 ${envelopeState === 'opening' ? 'opacity-0' : 'opacity-100'}`}>
              <p className={`font-display text-2xl font-semibold ${isDarkTheme ? 'text-white' : 'text-neutral-900'}`}>
                A card is waiting for you
              </p>
              <p className={`mt-2 text-sm ${isDarkTheme ? 'text-white/60' : 'text-neutral-500'}`}>
                Tap the envelope to open
              </p>
            </div>
          </button>
        </div>
      )}

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
            <button
              type="button"
              onClick={() => { void toggleMusic(); }}
              className="mr-2 w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900"
              aria-label={musicOn ? 'Mute music' : 'Play music'}
            >
              {musicOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span className="text-xs font-medium text-neutral-500">Greeting card</span>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-4">

        {/* Card */}
        <div className={`rounded-3xl shadow-lg shadow-black/10 overflow-hidden ${theme.card} ${
          envelopeState === 'open' ? 'animate-card-emerge' : 'opacity-0 translate-y-8'
        }`}>
          <div className={`h-1 w-full bg-gradient-to-r ${theme.accent}`} />

          {/* Title */}
          <div className="px-7 pt-7 pb-5 flex items-start justify-between gap-4">
            <div>
              <p className={`text-xs font-medium uppercase tracking-widest mb-1 ${isDarkTheme ? 'text-white/45' : 'text-neutral-400'}`}>A card for</p>
              <h1 className={`font-display text-3xl sm:text-4xl font-semibold leading-tight ${isDarkTheme ? 'text-white' : 'text-neutral-950'}`}>
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
            <div className={`px-7 py-6 border-t ${isDarkTheme ? 'border-white/10' : 'border-neutral-50'}`}>
              <p className={`font-display text-lg leading-relaxed whitespace-pre-wrap italic ${isDarkTheme ? 'text-white/80' : 'text-neutral-700'}`}>
                "{card.message}"
              </p>
            </div>
          )}
        </div>

        <div className={`flex items-center justify-center gap-2 text-xs ${isDarkTheme ? 'text-white/45' : 'text-neutral-400'}`}>
          <Music className="w-3.5 h-3.5" />
          <span>Ambient music made for this moment</span>
        </div>

        {musicError && (
          <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800 text-center">
            {musicError}
          </div>
        )}

        {voiceUrl && (
          <div className={`rounded-3xl shadow-lg shadow-black/5 p-6 ${isDarkTheme ? 'bg-slate-900 text-white' : 'bg-white'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium">A voice message for you</p>
                <p className={`text-xs ${isDarkTheme ? 'text-white/45' : 'text-neutral-400'}`}>
                  Press play to listen
                </p>
              </div>
            </div>
            <audio
              controls
              preload="metadata"
              src={voiceUrl}
              className="w-full"
              onPlay={lowerAmbientMusic}
              onPause={restoreAmbientMusic}
              onEnded={restoreAmbientMusic}
            />
          </div>
        )}

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
