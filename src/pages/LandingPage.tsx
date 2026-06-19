import { useNavigate } from 'react-router-dom';
import { Heart, Camera, QrCode, ArrowRight, Sparkles, MessageSquare } from 'lucide-react';

const steps = [
  { num: '01', icon: Heart, title: 'Name the recipient', desc: 'Enter the name of the person this card is for.' },
  { num: '02', icon: Camera, title: 'Upload photos', desc: 'Add up to 3 photos that will display as a slideshow.' },
  { num: '03', icon: MessageSquare, title: 'Write a message', desc: 'Add a personal note from the heart.' },
  { num: '04', icon: QrCode, title: 'Share instantly', desc: 'Get a unique link and QR code to send anywhere.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-black/5">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="font-semibold text-[15px] tracking-tight">WishLink</span>
          </div>
          <button
            onClick={() => navigate('/create')}
            className="bg-black text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-neutral-800 transition-colors"
          >
            Create a card
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-neutral-100 text-neutral-600 text-xs font-medium px-4 py-2 rounded-full mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            Digital greeting cards, beautifully simple
          </div>

          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-semibold leading-[1.08] tracking-tight text-neutral-950 mb-6 animate-fade-in-up">
            Share love,<br />
            <em className="not-italic shimmer-text">one link</em> at a time.
          </h1>

          <p className="text-lg text-neutral-500 max-w-lg mx-auto leading-relaxed mb-10 animate-fade-in-up delay-200">
            Create a personalised digital card with photos and a heartfelt message. Share it instantly via link or QR code.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up delay-300">
            <button
              onClick={() => navigate('/create')}
              className="group inline-flex items-center justify-center gap-2 bg-black text-white font-medium px-8 py-4 rounded-full text-base hover:bg-neutral-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Create your card
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center gap-2 text-neutral-700 font-medium px-8 py-4 rounded-full text-base border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all"
            >
              How it works
            </button>
          </div>
        </div>

        {/* Hero visual */}
        <div className="max-w-4xl mx-auto mt-16 animate-scale-in delay-400">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/10 border border-neutral-100">
            <img
              src="https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Friends celebrating"
              className="w-full h-64 sm:h-80 md:h-96 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div className="glass rounded-2xl px-4 py-3 border border-white/20">
                <p className="text-white text-xs font-medium opacity-80 mb-0.5">Card for</p>
                <p className="text-white font-semibold font-display text-lg">Sarah</p>
              </div>
              <div className="glass rounded-2xl p-3 border border-white/20">
                <QrCode className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-6 bg-neutral-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-neutral-950 mb-3">
              How it works
            </h2>
            <p className="text-neutral-500 text-base">Four simple steps to something they'll treasure.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div
                key={step.num}
                style={{ animationDelay: `${i * 0.12}s` }}
                className="animate-fade-in-up"
              >
                <div className="text-xs font-mono text-neutral-400 font-medium mb-4">{step.num}</div>
                <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-100 flex items-center justify-center mb-4 shadow-sm">
                  <step.icon className="w-5 h-5 text-neutral-700" />
                </div>
                <h3 className="font-semibold text-neutral-900 text-[15px] mb-2">{step.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-neutral-950">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white mb-4">
            Ready to make someone smile?
          </h2>
          <p className="text-neutral-400 text-base mb-8">
            Takes less than 2 minutes. No account required.
          </p>
          <button
            onClick={() => navigate('/create')}
            className="group inline-flex items-center gap-2 bg-white text-black font-medium px-8 py-4 rounded-full text-base hover:bg-neutral-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Get started free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-neutral-100">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
              <Heart className="w-2.5 h-2.5 text-white fill-white" />
            </div>
            <span className="text-sm font-medium text-neutral-700">WishLink</span>
          </div>
          <p className="text-xs text-neutral-400">Made with care. Share with love.</p>
        </div>
      </footer>
    </div>
  );
}
