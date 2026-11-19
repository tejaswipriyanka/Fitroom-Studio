import React, { useState } from 'react';
import { ArrowRight, Moon, Sun, Shirt, Layers, Sliders } from 'lucide-react';
import { FitroomSettings } from '../types';
import { HERO_ATELIER_IMAGE } from '../data/experts';

interface WelcomeSplashProps {
  onContinue: () => void;
  settings: FitroomSettings;
  onToggleTheme: () => void;
}

export const WelcomeSplash: React.FC<WelcomeSplashProps> = ({
  onContinue,
  settings,
  onToggleTheme,
}) => {
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-200">
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-8 border-b border-stone-200 dark:border-zinc-800">
        <span className="text-lg font-bold tracking-tight text-stone-900 dark:text-white whitespace-nowrap shrink-0">
          Fitroom Studio
        </span>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-stone-400">
          <a href="#stylists" className="hover:text-stone-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
            Stylists
          </a>
          <a href="#closet" className="hover:text-stone-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
            Digital Closet
          </a>
          <a href="#calibration" className="hover:text-stone-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
            Tone Calibration
          </a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle studio theme"
            className="p-2.5 rounded-lg border border-stone-200 dark:border-zinc-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-zinc-900 transition cursor-pointer"
          >
            {settings.theme === 'black' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-950 dark:bg-white text-white dark:text-black text-sm font-semibold hover:opacity-90 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Enter Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 lg:py-16 flex flex-col justify-center gap-14">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <p className="text-xs font-medium tracking-wider uppercase text-blue-700 dark:text-[#d48b55]">
              Personal Wardrobe &amp; Styling Atelier
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-stone-950 dark:text-white leading-[1.12]">
              Intentional daily outfits calibrated to your closet and tone.
            </h1>
            <p className="text-base text-stone-600 dark:text-stone-300 leading-relaxed max-w-xl">
              Consult four specialized wardrobe directors, catalog your own garments in a digital closet, compose mix-and-match looks, and audit color harmony across the Monk Skin Tone scale.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={onContinue}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-blue-700 dark:bg-[#8c4a1e] text-white text-sm font-semibold hover:bg-blue-800 dark:hover:bg-[#a15623] transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Start Styling Session</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onToggleTheme}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-stone-300 dark:border-zinc-700 text-stone-800 dark:text-stone-200 text-sm font-medium hover:bg-stone-50 dark:hover:bg-zinc-900 transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>
                  {settings.theme === 'black' ? 'Switch to Chalk & Oxford Blue' : 'Switch to Noir & Saddle Brown'}
                </span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-72 sm:h-96 lg:h-full min-h-[340px] rounded-2xl overflow-hidden border border-stone-200 dark:border-zinc-800 bg-stone-100 dark:bg-zinc-900">
              {!heroImgFailed ? (
                <img
                  src={HERO_ATELIER_IMAGE}
                  alt="Fitroom Studio sunlit minimalist boutique with tailored blazer, coat, trousers, knitwear, stone bench, and full-length mirror"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-stone-100 to-stone-200 dark:from-zinc-900 dark:to-zinc-800">
                  <Shirt className="w-10 h-10 text-stone-500 mb-3" />
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                    Fitroom Atelier Lookbook
                  </p>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/75 via-black/35 to-transparent">
                <p className="text-xs font-mono text-stone-200">
                  4 Stylist Personas · Monk Scale 1–10 · Closet-Only Mode
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-stone-200 dark:border-zinc-800 pt-10">
          <div id="stylists" className="space-y-2">
            <div className="flex items-center gap-2 text-stone-900 dark:text-white font-semibold text-sm">
              <Layers className="w-4 h-4 text-blue-700 dark:text-[#d48b55]" />
              <span>Specialized Stylist Consultation</span>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Upload garment photos, record quick voice questions, or filter advice by weather and formality level.
            </p>
          </div>

          <div id="closet" className="space-y-2">
            <div className="flex items-center gap-2 text-stone-900 dark:text-white font-semibold text-sm">
              <Shirt className="w-4 h-4 text-blue-700 dark:text-[#d48b55]" />
              <span>Digital Closet &amp; Mix-and-Match</span>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Catalog your tops, trousers, outerwear, and shoes to compose looks or lock AI advice to pieces you already own.
            </p>
          </div>

          <div id="calibration" className="space-y-2">
            <div className="flex items-center gap-2 text-stone-900 dark:text-white font-semibold text-sm">
              <Sliders className="w-4 h-4 text-blue-700 dark:text-[#d48b55]" />
              <span>Monk Tone &amp; Wardrobe Auditor</span>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Calibrate contrast ratios and hardware finishes against your Monk Skin Tone (1–10) and skin undertone.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};
