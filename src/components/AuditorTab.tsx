import React, { useState } from 'react';
import { Settings, User } from 'lucide-react';
import { MONK_SKIN_TONES, UNDERTONE_PALETTES } from '../data/experts';
import { AppSettings, UserProfile } from '../types';
import { FairnessBenchmarkTab } from './FairnessBenchmarkTab';
import { RulebookTab } from './RulebookTab';

interface AuditorTabProps {
  profile: UserProfile;
  settings: AppSettings;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export const AuditorTab: React.FC<AuditorTabProps> = ({
  profile,
  settings,
  onOpenSettings,
  onOpenProfile,
}) => {
  const [subTab, setSubTab] = useState<'audit' | 'benchmark' | 'rules'>('audit');

  const monkSpec =
    profile.defaultMonkSkinTone !== undefined
      ? MONK_SKIN_TONES.find((m) => m.scale === profile.defaultMonkSkinTone)
      : undefined;
  const undertoneSpec = profile.defaultUndertone ? UNDERTONE_PALETTES[profile.defaultUndertone] : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 dark:border-zinc-800 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-stone-950 dark:text-white">
            Wardrobe Option Auditor
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Inspect active fit parameters, Monk Skin Tone calibration, and studio rulebook standards.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-zinc-900 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              subTab === 'audit'
                ? 'bg-white dark:bg-[#1c1d24] text-stone-950 dark:text-white shadow-2xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Profile Audit
          </button>
          <button
            type="button"
            onClick={() => setSubTab('benchmark')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              subTab === 'benchmark'
                ? 'bg-white dark:bg-[#1c1d24] text-stone-950 dark:text-white shadow-2xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Monk Benchmark
          </button>
          <button
            type="button"
            onClick={() => setSubTab('rules')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              subTab === 'rules'
                ? 'bg-white dark:bg-[#1c1d24] text-stone-950 dark:text-white shadow-2xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Styling Rulebook
          </button>
        </div>
      </div>

      {subTab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#111216] p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-950 dark:text-white">
                Active Fit &amp; Style Preferences
              </h2>
              <button
                type="button"
                onClick={onOpenProfile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Edit Preferences</span>
              </button>
            </div>

            <dl className="divide-y divide-stone-100 dark:divide-zinc-800 text-sm">
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-stone-500 dark:text-stone-400">Login Mail Name</dt>
                <dd className="font-medium text-stone-900 dark:text-white">{profile.name}</dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-stone-500 dark:text-stone-400">Height</dt>
                <dd className="font-medium text-stone-900 dark:text-white">
                  {typeof profile.heightCm === 'number' ? `${profile.heightCm} cm` : 'Not shared (Optional)'}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-stone-500 dark:text-stone-400">Body Shape</dt>
                <dd className="font-medium text-stone-900 dark:text-white">
                  {profile.bodyShape || 'Not shared (Optional)'}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4 items-center">
                <dt className="text-stone-500 dark:text-stone-400">Monk Skin Tone</dt>
                <dd className="flex items-center gap-2 font-medium text-stone-900 dark:text-white">
                  {monkSpec ? (
                    <>
                      <span
                        className="w-4 h-4 rounded-full border border-black/15"
                        style={{ backgroundColor: monkSpec.hex }}
                      />
                      <span>{monkSpec.label}</span>
                    </>
                  ) : (
                    <span>Not shared (Optional)</span>
                  )}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-stone-500 dark:text-stone-400">Undertone</dt>
                <dd className="font-medium capitalize text-stone-900 dark:text-white">
                  {profile.defaultUndertone || 'Not shared (Optional)'}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-stone-500 dark:text-stone-400">Color Preferences</dt>
                <dd className="font-medium text-stone-900 dark:text-white text-right">
                  {profile.colorPreferences || 'Not specified'}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-stone-500 dark:text-stone-400">Clothing Preferences</dt>
                <dd className="font-medium text-stone-900 dark:text-white text-right">
                  {profile.clothingPreferences || 'Not specified'}
                </dd>
              </div>
            </dl>

            {(monkSpec || undertoneSpec) && (
              <div className="pt-2 border-t border-stone-200 dark:border-zinc-800 space-y-1.5 text-xs">
                <p className="font-semibold text-stone-900 dark:text-white">
                  Recommended Neutrals &amp; Accents
                </p>
                {monkSpec && (
                  <>
                    <p className="text-stone-600 dark:text-stone-400">
                      Neutrals: {monkSpec.bestNeutrals.join(' · ')}
                    </p>
                    <p className="text-stone-600 dark:text-stone-400">
                      Accents: {monkSpec.accentColors.join(' · ')}
                    </p>
                  </>
                )}
                {undertoneSpec && (
                  <p className="text-stone-600 dark:text-stone-400">
                    Metals: {undertoneSpec.metals}
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#111216] p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-950 dark:text-white">
                Studio Preferences &amp; Privacy
              </h2>
              <button
                type="button"
                onClick={onOpenSettings}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Manage Settings</span>
              </button>
            </div>

            <dl className="divide-y divide-stone-100 dark:divide-zinc-800 text-sm">
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-stone-500 dark:text-stone-400">Active Theme</dt>
                <dd className="font-medium text-stone-900 dark:text-white">
                  {settings.theme === 'dark' ? 'Noir & Saddle Brown' : 'Chalk & Oxford Blue'}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-stone-500 dark:text-stone-400">Chat History Retention</dt>
                <dd className="font-medium text-stone-900 dark:text-white">
                  {settings.storeHistory ? 'Enabled' : 'Disabled'}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-stone-500 dark:text-stone-400">Contrast Balance</dt>
                <dd className="font-medium text-stone-900 dark:text-white">
                  {monkSpec ? monkSpec.contrastLevel : 'Not calibrated (Optional)'}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      )}

      {subTab === 'benchmark' && <FairnessBenchmarkTab />}
      {subTab === 'rules' && <RulebookTab />}
    </div>
  );
};
