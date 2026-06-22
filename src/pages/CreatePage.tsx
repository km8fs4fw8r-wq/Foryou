import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Camera, ChevronRight, ChevronLeft, X,
  Upload, Check, Loader2, Sparkles,
} from 'lucide-react';
import { uploadPhoto, createCard } from '../lib/store';

const STEPS = [
  { id: 1, label: 'Recipient' },
  { id: 2, label: 'Photos' },
  { id: 3, label: 'Message' },
];

interface PhotoItem {
  file: File;
  preview: string;
}

export default function CreatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [recipientName, setRecipientName] = useState('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const newItems: PhotoItem[] = [];
      Array.from(files).forEach(file => {
        if (photos.length + newItems.length >= 3) return;
        if (!file.type.startsWith('image/')) return;
        newItems.push({ file, preview: URL.createObjectURL(file) });
      });
      setPhotos(prev => [...prev, ...newItems]);
    },
    [photos.length],
  );

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const canNext = () => {
    if (step === 1) return recipientName.trim().length > 0;
    if (step === 2) return photos.length > 0;
    if (step === 3) return message.trim().length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const cardId = crypto.randomUUID();
      const photoPaths = await Promise.all(
        photos.map(p => uploadPhoto(p.file, cardId)),
      );
      const savedId = await createCard({
        recipientName: recipientName.trim(),
        message: message.trim(),
        photoPaths,
      });
      navigate(`/card/${savedId}`);
    } catch (err) {
      console.error('[Supabase trace] Create Card flow stopped', err);
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 glass border-b border-black/5">
        <div className="max-w-xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="font-semibold text-[15px] tracking-tight">WishLink</span>
          </button>
          <span className="text-sm text-neutral-400 font-medium">
            {step} / {STEPS.length}
          </span>
        </div>
      </header>

      {/* Progress bar + step labels */}
      <div className="fixed top-16 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-100">
        <div className="h-1 bg-neutral-100">
          <div
            className="h-full bg-black transition-all duration-500 ease-out"
            style={{ width: `${(step / STEPS.length) * 100}%` }}
          />
        </div>
        <div className="max-w-xl mx-auto px-6 py-3 flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3 text-neutral-200 flex-shrink-0" />}
              <div
                className={`flex items-center gap-1.5 transition-all duration-200 ${
                  step === s.id ? 'opacity-100' : step > s.id ? 'opacity-60' : 'opacity-25'
                }`}
              >
                {step > s.id ? (
                  <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                ) : (
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                      step === s.id
                        ? 'border-black bg-black text-white'
                        : 'border-neutral-300 text-neutral-400'
                    }`}
                  >
                    {s.id}
                  </div>
                )}
                <span className="text-xs font-medium text-neutral-600 hidden sm:block">{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="pt-36 pb-32 px-6">
        <div className="max-w-xl mx-auto">

          {/* Step 1 — Recipient */}
          {step === 1 && (
            <div className="animate-fade-in-up">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">Step 1</p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-neutral-950 mb-2">
                Who is this card for?
              </h2>
              <p className="text-neutral-500 mb-8">Enter the name of the person receiving this card.</p>
              <input
                type="text"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                placeholder="e.g. Sarah, Mum, Alex..."
                maxLength={50}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter' && canNext()) setStep(2); }}
                className="w-full text-2xl sm:text-3xl font-display font-medium text-neutral-900 placeholder:text-neutral-300 border-0 border-b-2 border-neutral-200 focus:border-black outline-none pb-3 pt-1 transition-colors bg-transparent"
              />
              {recipientName.trim() && (
                <p className="mt-5 text-sm text-neutral-500 animate-fade-in">
                  Creating a card for{' '}
                  <span className="font-semibold text-neutral-800">{recipientName.trim()}</span>.
                </p>
              )}
            </div>
          )}

          {/* Step 2 — Photos */}
          {step === 2 && (
            <div className="animate-fade-in-up">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">Step 2</p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-neutral-950 mb-2">
                Add photos
              </h2>
              <p className="text-neutral-500 mb-8">Upload up to 3 photos for the card.</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => handlePhotoSelect(e.target.files)}
              />

              {photos.length === 0 ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-neutral-200 rounded-3xl p-14 text-center hover:border-neutral-400 hover:bg-neutral-50 transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-7 h-7 text-neutral-400" />
                  </div>
                  <p className="font-medium text-neutral-700 mb-1">Click to upload photos</p>
                  <p className="text-sm text-neutral-400">JPEG, PNG, WebP — up to 3 photos</p>
                </button>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {photos.map((photo, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-2xl overflow-hidden group animate-scale-in"
                      >
                        <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {photos.length < 3 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-2xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-2 hover:border-neutral-400 hover:bg-neutral-50 transition-all"
                      >
                        <Camera className="w-6 h-6 text-neutral-300" />
                        <span className="text-xs text-neutral-400 font-medium">Add more</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 text-right font-medium">{photos.length}/3 photos</p>
                </>
              )}
            </div>
          )}

          {/* Step 3 — Message */}
          {step === 3 && (
            <div className="animate-fade-in-up">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">Step 3</p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-neutral-950 mb-2">
                Write your message
              </h2>
              <p className="text-neutral-500 mb-8">
                A personal note for{' '}
                <span className="font-medium text-neutral-700">{recipientName}</span>.
              </p>
              <div className="relative">
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={`Dear ${recipientName},\n\nI wanted to take a moment to tell you...`}
                  maxLength={1000}
                  rows={9}
                  autoFocus
                  className="w-full text-base text-neutral-800 placeholder:text-neutral-300 border border-neutral-200 rounded-2xl focus:border-neutral-400 outline-none p-5 resize-none leading-relaxed transition-colors bg-transparent font-display"
                />
                <span className="absolute bottom-4 right-4 text-xs text-neutral-300 font-medium">
                  {message.length}/1000
                </span>
              </div>

              {submitError && (
                <div className="mt-5 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm">
                  {submitError}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Bottom nav */}
      <div className="fixed bottom-0 inset-x-0 glass border-t border-black/5">
        <div className="max-w-xl mx-auto px-6 py-4 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={isSubmitting}
              className="flex items-center gap-2 text-sm font-medium text-neutral-600 px-5 py-3.5 rounded-full border border-neutral-200 hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <button
            onClick={step === STEPS.length ? handleSubmit : () => setStep(s => s + 1)}
            disabled={!canNext() || isSubmitting}
            className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium px-5 py-3.5 rounded-full transition-all ${
              canNext() && !isSubmitting
                ? 'bg-black text-white hover:bg-neutral-800 active:scale-[0.98]'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving your card...
              </>
            ) : step === STEPS.length ? (
              <>
                <Sparkles className="w-4 h-4" />
                Generate card
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
