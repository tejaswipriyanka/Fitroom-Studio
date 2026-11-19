import React, { useMemo, useState } from 'react';
import { MessageSquare, Shuffle } from 'lucide-react';
import { MONK_SKIN_TONES, STARTER_CAPSULE_ITEMS, UNDERTONE_PALETTES } from '../data/experts';
import { ClosetCategory, ClosetItem, ExpertStylist, GuestProfile } from '../types';

interface OutfitBuilderTabProps {
  closetItems: ClosetItem[];
  guestProfile: GuestProfile;
  activeExpert: ExpertStylist;
  selectedOccasion: string;
  onSendLookToChat: (lookSummary: string) => void;
}

const SLOTS: { key: Exclude<ClosetCategory, 'full_outfit'>; label: string }[] = [
  { key: 'outerwear', label: 'Outerwear' },
  { key: 'tops', label: 'Top' },
  { key: 'bottoms', label: 'Bottom' },
  { key: 'footwear', label: 'Footwear' },
  { key: 'accessories', label: 'Accessory' },
];

export const OutfitBuilderTab: React.FC<OutfitBuilderTabProps> = ({
  closetItems,
  guestProfile,
  activeExpert,
  selectedOccasion,
  onSendLookToChat,
}) => {
  const [showStudioSamples, setShowStudioSamples] = useState(false);

  const poolByCategory = useMemo(() => {
    const source: ClosetItem[] =
      closetItems.length > 0
        ? closetItems
        : showStudioSamples
        ? STARTER_CAPSULE_ITEMS.map((item, idx) => ({
            ...item,
            id: `studio_sample_${idx}`,
            createdAt: new Date().toISOString(),
          }))
        : [];

    const map: Record<Exclude<ClosetCategory, 'full_outfit'>, ClosetItem[]> = {
      outerwear: [],
      tops: [],
      bottoms: [],
      footwear: [],
      accessories: [],
    };

    source.forEach((item) => {
      if (item.category !== 'full_outfit' && map[item.category]) {
        map[item.category].push(item);
      }
    });

    return map;
  }, [closetItems, showStudioSamples]);

  const [selectedIds, setSelectedIds] = useState<Record<string, string>>({});

  const activeOutfit = useMemo(() => {
    const result: Record<string, ClosetItem | null> = {};
    SLOTS.forEach((slot) => {
      const items = poolByCategory[slot.key];
      const chosenId = selectedIds[slot.key];
      result[slot.key] = items.find((i) => i.id === chosenId) || items[0] || null;
    });
    return result;
  }, [poolByCategory, selectedIds]);

  const handleRandomizeLook = () => {
    const next: Record<string, string> = {};
    SLOTS.forEach((slot) => {
      const items = poolByCategory[slot.key];
      if (items.length > 0) {
        const pick = items[Math.floor(Math.random() * items.length)];
        next[slot.key] = pick.id;
      }
    });
    setSelectedIds(next);
  };

  const monkSpec =
    guestProfile.skinToneMonk !== undefined
      ? MONK_SKIN_TONES.find((m) => m.scale === guestProfile.skinToneMonk)
      : undefined;
  const undertoneSpec = guestProfile.undertone ? UNDERTONE_PALETTES[guestProfile.undertone] : undefined;

  const selectedPiecesList = SLOTS.map((s) => ({
    slotLabel: s.label,
    item: activeOutfit[s.key],
  })).filter((entry): entry is { slotLabel: string; item: ClosetItem } => entry.item !== null);

  const handleCritiqueInChat = () => {
    if (selectedPiecesList.length === 0) return;
    const lines = selectedPiecesList.map(
      (entry) =>
        `- ${entry.slotLabel}: ${entry.item.name} (${entry.item.colorName}${entry.item.fabric ? `, ${entry.item.fabric}` : ''})`
    );
    const sharedNotes = [
      typeof guestProfile.heightCm === 'number' ? `height ${guestProfile.heightCm} cm` : '',
      guestProfile.bodyShape ? `body shape ${guestProfile.bodyShape}` : '',
      guestProfile.skinToneMonk !== undefined ? `MST ${guestProfile.skinToneMonk}` : '',
      guestProfile.undertone ? `${guestProfile.undertone} undertone` : '',
    ]
      .filter(Boolean)
      .join(', ');
    const prompt = `Please critique this outfit combination I composed in Mix & Match Studio for ${selectedOccasion}:\n${lines.join('\n')}\n${
      sharedNotes
        ? `Evaluate proportion and color harmony using my shared details (${sharedNotes}), and suggest one subtle refinement.`
        : 'Evaluate the overall color balance and silhouette cohesion, and suggest one subtle refinement.'
    }`;
    onSendLookToChat(prompt);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 dark:border-zinc-800 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-stone-950 dark:text-white">
            Mix &amp; Match Studio
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {closetItems.length > 0
              ? `Composing from your ${closetItems.length} cataloged pieces for ${selectedOccasion}.`
              : `Your Digital Closet currently has 0 pieces. Add garments in My Digital Closet or preview sample combinations below.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {closetItems.length === 0 && (
            <button
              type="button"
              onClick={() => setShowStudioSamples((prev) => !prev)}
              className="px-4 py-2 rounded-xl border border-stone-300 dark:border-zinc-700 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition cursor-pointer whitespace-nowrap"
            >
              {showStudioSamples ? 'Hide Sample Pieces' : 'Preview Sample Pieces'}
            </button>
          )}
          <button
            type="button"
            disabled={selectedPiecesList.length === 0}
            onClick={handleRandomizeLook}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-300 dark:border-zinc-700 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-zinc-800 disabled:opacity-45 transition cursor-pointer whitespace-nowrap"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle Combination</span>
          </button>
          <button
            type="button"
            disabled={selectedPiecesList.length === 0}
            onClick={handleCritiqueInChat}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 dark:bg-[#8c4a1e] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-45 transition cursor-pointer whitespace-nowrap"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask {activeExpert.name} to Critique</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Slot Selectors */}
        <div className="lg:col-span-7 space-y-4">
          {SLOTS.map((slot) => {
            const options = poolByCategory[slot.key];
            const current = activeOutfit[slot.key];
            return (
              <div
                key={slot.key}
                className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#111216] p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                    {slot.label}
                  </span>
                  {current && (
                    <span className="text-xs text-stone-500 dark:text-stone-400 capitalize">
                      {current.formality.replace('_', ' ')}
                    </span>
                  )}
                </div>

                {options.length === 0 ? (
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    No {slot.label.toLowerCase()} pieces in this slot yet.
                  </p>
                ) : (
                  <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                    {options.map((opt) => {
                      const isSelected = current?.id === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setSelectedIds((prev) => ({ ...prev, [slot.key]: opt.id }))
                          }
                          className={`shrink-0 text-left px-3 py-2.5 rounded-xl border transition flex items-center gap-2.5 cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 dark:border-[#d48b55] bg-blue-50/60 dark:bg-[#8c4a1e]/15'
                              : 'border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-900'
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-md border border-black/10 shrink-0"
                            style={{ backgroundColor: opt.colorHex }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-stone-900 dark:text-white whitespace-nowrap">
                              {opt.name}
                            </p>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 whitespace-nowrap">
                              {opt.colorName}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Lookbook Canvas & Tone Calibration */}
        <div className="lg:col-span-5 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-stone-50/70 dark:bg-[#111216] p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-stone-950 dark:text-white">
                Lookbook Composition
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {selectedOccasion}
                {typeof guestProfile.heightCm === 'number' ? ` · ${guestProfile.heightCm} cm` : ''}
              </p>
            </div>
            {monkSpec ? (
              <div className="flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded-full border border-black/15"
                  style={{ backgroundColor: monkSpec.hex }}
                  title={monkSpec.label}
                />
                <span className="text-xs font-mono tabular-nums text-stone-700 dark:text-stone-300">
                  MST {monkSpec.scale}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                Tone: Not shared
              </span>
            )}
          </div>

          {/* Color Palette Stack */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-stone-600 dark:text-stone-400">
              Garment Stack &amp; Palette
            </p>
            <div className="space-y-2">
              {selectedPiecesList.map(({ slotLabel, item }) => (
                <div
                  key={slotLabel}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#16171d] border border-stone-200 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-8 h-8 rounded-lg border border-black/10 shrink-0"
                      style={{ backgroundColor: item.colorHex }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-stone-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                        {slotLabel} · {item.colorName}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 shrink-0">
                    {item.colorHex}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Undertone Alignment Note */}
          <div className="border-t border-stone-200 dark:border-zinc-800 pt-4 space-y-2">
            {undertoneSpec || monkSpec ? (
              <>
                <p className="text-xs font-semibold text-stone-900 dark:text-white">
                  Tone &amp; Hardware Guidance
                  {guestProfile.undertone ? ` (${guestProfile.undertone} undertone)` : ''}
                </p>
                {monkSpec && (
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    Ideal contrast level for {monkSpec.label}:{' '}
                    <strong className="text-stone-900 dark:text-white">{monkSpec.contrastLevel}</strong>.
                  </p>
                )}
                {undertoneSpec && (
                  <>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {undertoneSpec.summary}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Recommended metals: <span className="text-stone-800 dark:text-stone-200">{undertoneSpec.metals}</span>
                    </p>
                  </>
                )}
              </>
            ) : (
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Universal fit preview. Share optional skin tone or undertone details in your profile anytime if you want tone-specific contrast notes.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
