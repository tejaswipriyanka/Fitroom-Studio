import React from 'react';
import { UNDERTONE_PALETTES } from '../data/experts';
import { UndertoneType } from '../types';

const PROPORTION_PRINCIPLES = [
  {
    title: '01. Rule of Thirds Silhouette',
    detail:
      'Divide your outfit roughly 1/3 upper body and 2/3 lower body (or vice versa with long outerwear) rather than an even 50/50 horizontal split.',
  },
  {
    title: '02. Two-Neutral + One-Accent Budget',
    detail:
      'Anchor 80% of the outfit in two neutral shades (navy, chalk, charcoal, espresso) and reserve one intentional accent color for collar, knit, or shoe.',
  },
  {
    title: '03. Texture Over Loud Pattern',
    detail:
      'When dressing monochrome, mix matte brushed twill, ribbed knitwear, and smooth leather so pieces separate cleanly in natural light.',
  },
  {
    title: '04. Collar & Hem Calibration',
    detail:
      'Shoulder seams should meet the bone cleanly on tailored jackets, while straight trousers should rest with a light half-break or clean no-break over shoes.',
  },
];

export const RulebookTab: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-1 border-b border-stone-200 dark:border-zinc-800 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-stone-950 dark:text-white">
          Fitroom Styling &amp; Color Rulebook
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Core proportion and undertone guidelines applied by our studio stylists.
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {PROPORTION_PRINCIPLES.map((rule) => (
          <div
            key={rule.title}
            className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#111216] p-5 space-y-2"
          >
            <h3 className="text-sm font-semibold text-stone-950 dark:text-white">
              {rule.title}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              {rule.detail}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-bold text-stone-950 dark:text-white">
          Undertone Color &amp; Metal Matrix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(Object.keys(UNDERTONE_PALETTES) as UndertoneType[]).map((key) => {
            const spec = UNDERTONE_PALETTES[key];
            return (
              <div
                key={key}
                className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-stone-50/70 dark:bg-[#111216] p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold capitalize text-stone-950 dark:text-white">
                    {key} Undertone
                  </h4>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    {spec.metals}
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  {spec.summary}
                </p>
                <div className="text-xs space-y-1 pt-1">
                  <p className="text-stone-800 dark:text-stone-200">
                    <span className="font-semibold">Strongest Hues:</span>{' '}
                    {spec.idealColors.join(' · ')}
                  </p>
                  <p className="text-stone-500 dark:text-stone-400">
                    <span className="font-semibold">Use Sparingly:</span>{' '}
                    {spec.cautionColors.join(' · ')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
