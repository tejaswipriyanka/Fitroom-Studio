import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { MONK_SKIN_TONES } from '../data/experts';
import { GuestProfile, UndertoneType } from '../types';

interface GuestProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: GuestProfile;
  accountId?: string;
  onUpdateProfile: (profile: GuestProfile) => void;
}

const BODY_SHAPES = [
  'Rectangle / Straight',
  'Hourglass',
  'Pear / Triangle',
  'Inverted Triangle',
  'Apple / Round',
  'Athletic / Broad',
];

export const GuestProfileModal: React.FC<GuestProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  accountId,
  onUpdateProfile,
}) => {
  const [heightInput, setHeightInput] = useState<string>('');
  const [skinToneMonk, setSkinToneMonk] = useState<number | undefined>(undefined);
  const [undertone, setUndertone] = useState<UndertoneType | undefined>(undefined);
  const [bodyShape, setBodyShape] = useState<string>('');
  const [colorPreferences, setColorPreferences] = useState<string>('');
  const [clothingPreferences, setClothingPreferences] = useState<string>('');

  useEffect(() => {
    setHeightInput(profile.heightCm !== undefined ? String(profile.heightCm) : '');
    setSkinToneMonk(profile.skinToneMonk);
    setUndertone(profile.undertone);
    setBodyShape(profile.bodyShape || '');
    setColorPreferences(profile.colorPreferences || '');
    setClothingPreferences(profile.clothingPreferences || '');
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedHeight = Number(heightInput.trim());
    const validHeight =
      heightInput.trim() && Number.isFinite(parsedHeight) && parsedHeight >= 100 && parsedHeight <= 240
        ? Math.round(parsedHeight)
        : undefined;

    onUpdateProfile({
      name: profile.name,
      status: profile.status,
      avatarInitials: profile.avatarInitials,
      isGuest: profile.isGuest,
      joinedAt: profile.joinedAt,
      heightCm: validHeight,
      skinToneMonk,
      undertone,
      bodyShape: bodyShape.trim() || undefined,
      colorPreferences: colorPreferences.trim() || undefined,
      clothingPreferences: clothingPreferences.trim() || undefined,
      preferencesReviewed: true,
    });
    onClose();
  };

  const handleSkipAll = () => {
    onUpdateProfile({
      name: profile.name,
      status: profile.status,
      avatarInitials: profile.avatarInitials,
      isGuest: profile.isGuest,
      joinedAt: profile.joinedAt,
      heightCm: undefined,
      skinToneMonk: undefined,
      undertone: undefined,
      bodyShape: undefined,
      colorPreferences: undefined,
      clothingPreferences: undefined,
      preferencesReviewed: true,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <form
        onSubmit={handleSave}
        className="w-full max-w-xl bg-white dark:bg-[#111216] border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 id="profile-modal-title" className="text-base font-bold text-stone-950 dark:text-white">
              Optional Fit &amp; Style Details
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Account: {profile.name} ({profile.status}
              {accountId ? ` · ${accountId.slice(0, 10)}` : ''})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close styling preferences"
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/60 px-4 py-3 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
            Share only what feels comfortable. Every detail below is <strong className="font-semibold text-stone-900 dark:text-white">optional</strong>—our stylists never estimate unshared attributes and never collect personal data beyond your login mail ID username.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pref-height" className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Height in cm (optional)
              </label>
              <input
                id="pref-height"
                type="number"
                min={100}
                max={240}
                value={heightInput}
                onChange={(e) => setHeightInput(e.target.value)}
                placeholder="Prefer not to share"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 text-sm text-stone-900 dark:text-white tabular-nums placeholder:text-stone-400"
              />
            </div>

            <div>
              <label htmlFor="pref-body-shape" className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Body Shape (optional)
              </label>
              <select
                id="pref-body-shape"
                value={bodyShape}
                onChange={(e) => setBodyShape(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 text-sm text-stone-900 dark:text-white"
              >
                <option value="">Prefer not to share</option>
                {BODY_SHAPES.map((shape) => (
                  <option key={shape} value={shape}>
                    {shape}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                Skin Undertone (optional)
              </span>
              {undertone && (
                <button
                  type="button"
                  onClick={() => setUndertone(undefined)}
                  className="text-[11px] font-medium text-blue-700 dark:text-[#d48b55] hover:underline cursor-pointer"
                >
                  Clear selection
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['warm', 'cool', 'neutral', 'olive'] as UndertoneType[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUndertone(undertone === u ? undefined : u)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize transition cursor-pointer ${
                    undertone === u
                      ? 'bg-blue-700 dark:bg-[#8c4a1e] text-white border-transparent'
                      : 'border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                Skin Tone — Monk Scale (optional)
                {skinToneMonk !== undefined ? `: MST ${skinToneMonk}` : ': Not shared'}
              </span>
              {skinToneMonk !== undefined && (
                <button
                  type="button"
                  onClick={() => setSkinToneMonk(undefined)}
                  className="text-[11px] font-medium text-blue-700 dark:text-[#d48b55] hover:underline cursor-pointer"
                >
                  Not sharing
                </button>
              )}
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {MONK_SKIN_TONES.map((tone) => {
                const active = skinToneMonk === tone.scale;
                return (
                  <button
                    key={tone.scale}
                    type="button"
                    onClick={() => setSkinToneMonk(active ? undefined : tone.scale)}
                    title={tone.label}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border transition cursor-pointer ${
                      active
                        ? 'border-blue-700 dark:border-[#d48b55] ring-2 ring-blue-600/30 dark:ring-[#d48b55]/30'
                        : 'border-stone-200 dark:border-zinc-800 hover:border-stone-400'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-black/10"
                      style={{ backgroundColor: tone.hex }}
                    />
                    <span className="text-[10px] font-mono tabular-nums text-stone-600 dark:text-stone-400">
                      {tone.scale}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="pref-colors" className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Color Preferences, if any (optional)
            </label>
            <input
              id="pref-colors"
              type="text"
              maxLength={160}
              value={colorPreferences}
              onChange={(e) => setColorPreferences(e.target.value)}
              placeholder="e.g., Navy, Olive, Earth tones, Avoid neon (or leave blank)"
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 text-sm text-stone-900 dark:text-white placeholder:text-stone-400"
            />
          </div>

          <div>
            <label htmlFor="pref-clothing" className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Clothing Preferences, if any (optional)
            </label>
            <input
              id="pref-clothing"
              type="text"
              maxLength={160}
              value={clothingPreferences}
              onChange={(e) => setClothingPreferences(e.target.value)}
              placeholder="e.g., Relaxed linen, modest cuts, menswear, oversized tees (or leave blank)"
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 text-sm text-stone-900 dark:text-white placeholder:text-stone-400"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-stone-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSkipAll}
            className="px-4 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-zinc-800 cursor-pointer whitespace-nowrap"
          >
            Skip / Don&apos;t Share
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-stone-300 cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-stone-950 dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 cursor-pointer whitespace-nowrap"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
