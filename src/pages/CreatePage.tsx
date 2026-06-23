import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, ChevronRight, ChevronLeft, X,
  Upload, Check, Loader2, Sparkles, Mic, Square, Trash2,
} from 'lucide-react';
import { uploadPhoto, uploadVoice, createCard } from '../lib/store';
import { CARD_THEMES, type CardTheme } from '../lib/themes';

const STEPS = [
  { id: 1, label: 'Recipient' },
  { id: 2, label: 'Media' },
  { id: 3, label: 'Theme' },
  { id: 4, label: 'Message' },
];

interface PhotoItem {
  file: File;
  preview: string;
}

function isHeicFile(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    extension === 'heic' ||
    extension === 'heif'
  );
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('This browser could not decode the HEIC photo.'));
      element.src = objectUrl;
    });

    const maxDimension = 2400;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Photo conversion is unavailable in this browser.');

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        result => {
          if (result) resolve(result);
          else reject(new Error('Failed to convert the HEIC photo to JPEG.'));
        },
        'image/jpeg',
        0.9,
      );
    });

    const baseName = file.name.replace(/\.(heic|heif)$/i, '') || 'photo';
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: file.lastModified,
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function CreatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [recipientName, setRecipientName] = useState('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voicePreviewUrl, setVoicePreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [theme, setTheme] = useState<CardTheme>('classic');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const handlePhotoSelect = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const file = Array.from(files)[0];
      if (!file || photos.length >= 1) return;

      setSubmitError(null);

      try {
        const uploadFile = isHeicFile(file)
          ? await convertHeicToJpeg(file)
          : file;

        if (!uploadFile.type.startsWith('image/')) {
          throw new Error('Please choose a valid image file.');
        }

        setPhotos(prev => [
          ...prev,
          { file: uploadFile, preview: URL.createObjectURL(uploadFile) },
        ]);
      } catch (err) {
        console.error('[Photo conversion] HEIC conversion failed', err);
        setSubmitError(
          err instanceof Error
            ? err.message
            : 'Failed to prepare this photo. Please choose a JPEG, PNG, or WebP image.',
        );
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [photos.length],
  );

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const startRecording = async () => {
    setSubmitError(null);

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setSubmitError('Voice recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredTypes = [
        'audio/mp4',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
      ];
      const mimeType = preferredTypes.find(type => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recordingChunksRef.current = [];
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      setRecordingSeconds(0);
      setIsRecording(true);

      recorder.ondataavailable = event => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        setVoiceBlob(blob);
        setVoicePreviewUrl(previous => {
          if (previous) URL.revokeObjectURL(previous);
          return URL.createObjectURL(blob);
        });
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      };

      recorder.start();
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(seconds => {
          if (seconds >= 119) {
            stopRecording();
            return 120;
          }
          return seconds + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('[Voice recording] Failed to start', err);
      setSubmitError('Microphone access was denied or unavailable.');
      setIsRecording(false);
    }
  };

  const removeVoice = () => {
    if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
    setVoicePreviewUrl(null);
    setVoiceBlob(null);
    setRecordingSeconds(0);
  };

  const formatDuration = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  const canNext = () => {
    if (step === 1) return recipientName.trim().length > 0;
    if (step === 2) return !isRecording;
    if (step === 3) return Boolean(theme);
    if (step === 4) return message.trim().length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const cardId = crypto.randomUUID();
      const [photoPath, voicePath] = await Promise.all([
        photos[0] ? uploadPhoto(photos[0].file, cardId) : Promise.resolve(null),
        voiceBlob ? uploadVoice(voiceBlob, cardId) : Promise.resolve(null),
      ]);
      const savedId = await createCard({
        recipientName: recipientName.trim(),
        message: message.trim(),
        photoPath,
        voicePath,
        theme,
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

          {/* Step 2 — Optional media */}
          {step === 2 && (
            <div className="animate-fade-in-up">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">Step 2</p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-neutral-950 mb-2">
                Add something personal
              </h2>
              <p className="text-neutral-500 mb-8">
                Photo and voice are optional. Add either one, both, or skip this step.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif,image/heic,image/heif"
                className="hidden"
                onChange={e => { void handlePhotoSelect(e.target.files); }}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-neutral-200 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium text-neutral-800">Photo</p>
                      <p className="text-xs text-neutral-400">Optional</p>
                    </div>
                    <Upload className="w-5 h-5 text-neutral-300" />
                  </div>

                  {photos.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-square rounded-2xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-2 hover:border-neutral-400 hover:bg-neutral-50 transition-all"
                    >
                      <Upload className="w-6 h-6 text-neutral-300" />
                      <span className="text-sm text-neutral-500">Choose photo</span>
                      <span className="text-xs text-neutral-300">HEIC supported</span>
                    </button>
                  ) : (
                    <div className="relative aspect-square rounded-2xl overflow-hidden group">
                      <img
                        src={photos[0].preview}
                        alt="Selected"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(0)}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center"
                        aria-label="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-neutral-200 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium text-neutral-800">Voice message</p>
                      <p className="text-xs text-neutral-400">Optional · up to 2 minutes</p>
                    </div>
                    <Mic className={`w-5 h-5 ${isRecording ? 'text-red-500' : 'text-neutral-300'}`} />
                  </div>

                  {!voiceBlob ? (
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : () => { void startRecording(); }}
                      className={`w-full aspect-square rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${
                        isRecording
                          ? 'border-red-200 bg-red-50 text-red-600'
                          : 'border-dashed border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-600'
                      }`}
                    >
                      <div className={`relative w-14 h-14 rounded-full flex items-center justify-center ${
                        isRecording ? 'bg-red-500 text-white recording-ring' : 'bg-neutral-100'
                      }`}>
                        {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-6 h-6" />}
                      </div>
                      <span className="font-medium">
                        {isRecording ? 'Tap to stop' : 'Record message'}
                      </span>
                      <span className="text-sm">
                        {isRecording ? formatDuration(recordingSeconds) : 'Microphone permission required'}
                      </span>
                    </button>
                  ) : (
                    <div className="aspect-square rounded-2xl bg-neutral-50 border border-neutral-100 p-4 flex flex-col items-center justify-center gap-5">
                      <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center">
                        <Mic className="w-6 h-6" />
                      </div>
                      {voicePreviewUrl && (
                        <audio controls src={voicePreviewUrl} className="w-full" />
                      )}
                      <button
                        type="button"
                        onClick={removeVoice}
                        className="inline-flex items-center gap-2 text-sm text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete recording
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {submitError && (
                <div className="mt-5 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm">
                  {submitError}
                </div>
              )}

              {!photos.length && !voiceBlob && !isRecording && (
                <p className="mt-5 text-center text-sm text-neutral-400">
                  Nothing to add? Tap Continue to skip.
                </p>
              )}
            </div>
          )}

          {/* Step 3 — Theme */}
          {step === 3 && (
            <div className="animate-fade-in-up">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">Step 3</p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-neutral-950 mb-2">
                Choose a theme
              </h2>
              <p className="text-neutral-500 mb-8">
                Set the mood for the moment they open it.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {CARD_THEMES.map(option => {
                  const selected = theme === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setTheme(option.id)}
                      className={`relative overflow-hidden rounded-2xl border p-3 text-left transition-all ${
                        selected
                          ? 'border-black ring-2 ring-black/10'
                          : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      <div className={`h-24 rounded-xl bg-gradient-to-br ${option.preview} mb-3 relative overflow-hidden`}>
                        <div className="absolute left-1/2 top-6 h-14 w-20 -translate-x-1/2 rounded-lg bg-white/80 shadow-md" />
                        {selected && (
                          <div className="absolute right-2 top-2 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-neutral-900">{option.name}</p>
                      <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4 — Message */}
          {step === 4 && (
            <div className="animate-fade-in-up">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">Step 4</p>
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
