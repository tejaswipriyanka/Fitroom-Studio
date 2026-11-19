import React from 'react';
import { MONK_SKIN_TONES } from '../data/experts';

export const FairnessBenchmarkTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1 border-b border-stone-200 dark:border-zinc-800 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-stone-950 dark:text-white">
          Monk Skin Tone (1–10) Calibration Matrix
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Equitable contrast and color recommendations calibrated across all ten Monk Skin Tone levels rather than single-tone assumptions.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#111216]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-200 dark:border-zinc-800 text-xs font-semibold text-stone-500 dark:text-stone-400">
              <th className="py-3 px-4">Scale</th>
              <th className="py-3 px-4">Reference</th>
              <th className="py-3 px-4">Contrast Range</th>
              <th className="py-3 px-4">Anchor Neutrals</th>
              <th className="py-3 px-4">Accent Hues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/80 text-xs">
            {MONK_SKIN_TONES.map((row) => (
              <tr key={row.scale} className="hover:bg-stone-50/70 dark:hover:bg-zinc-900/50">
                <td className="py-3 px-4 font-mono tabular-nums font-semibold text-stone-900 dark:text-white">
                  MST {row.scale}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-5 h-5 rounded-full border border-black/15 shrink-0"
                      style={{ backgroundColor: row.hex }}
                    />
                    <span className="text-stone-800 dark:text-stone-200">{row.label.split('—')[1]?.trim() || row.label}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-stone-600 dark:text-stone-300">
                  {row.contrastLevel}
                </td>
                <td className="py-3 px-4 text-stone-700 dark:text-stone-300">
                  {row.bestNeutrals.join(' · ')}
                </td>
                <td className="py-3 px-4 text-blue-700 dark:text-[#d48b55] font-medium">
                  {row.accentColors.join(' · ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
