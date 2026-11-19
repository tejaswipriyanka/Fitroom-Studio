import React, { useMemo, useState } from 'react';
import {
  Heart,
  Layers,
  MessageSquare,
  Plus,
  Search,
  Shirt,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { FORMALITY_OPTIONS, STARTER_CAPSULE_ITEMS } from '../data/experts';
import {
  ClosetCategory,
  ClosetItem,
  FormalityLevel,
  GuestProfile,
} from '../types';

interface ClosetTabProps {
  closetItems: ClosetItem[];
  onAddItem: (item: ClosetItem) => void;
  onDeleteItem: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onStyleItemInChat: (item: ClosetItem) => void;
  onOpenInOutfitBuilder: (item: ClosetItem) => void;
  guestProfile: GuestProfile;
}

const CATEGORIES: { id: 'all' | ClosetCategory; label: string }[] = [
  { id: 'all', label: 'All Pieces' },
  { id: 'tops', label: 'Tops' },
  { id: 'bottoms', label: 'Bottoms' },
  { id: 'outerwear', label: 'Outerwear' },
  { id: 'footwear', label: 'Footwear' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'full_outfit', label: 'Full Outfits' },
];

const COLOR_PRESETS = [
  { name: 'Chalk White', hex: '#F4F4F0' },
  { name: 'Oxford Blue', hex: '#2A4B7C' },
  { name: 'Charcoal Slate', hex: '#2F3337' },
  { name: 'Deep Indigo', hex: '#1D293D' },
  { name: 'Warm Sandstone', hex: '#C7B8A1' },
  { name: 'Saddle Brown', hex: '#7A4928' },
  { name: 'Olive Moss', hex: '#5A6344' },
  { name: 'Obsidian Black', hex: '#18181B' },
];

export const ClosetTab: React.FC<ClosetTabProps> = ({
  closetItems,
  onAddItem,
  onDeleteItem,
  onToggleFavorite,
  onStyleItemInChat,
  onOpenInOutfitBuilder,
  guestProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | ClosetCategory>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClosetCategory>('tops');
  const [colorName, setColorName] = useState('Oxford Blue');
  const [colorHex, setColorHex] = useState('#2A4B7C');
  const [fabric, setFabric] = useState('Cotton Oxford');
  const [season, setSeason] = useState('All Seasons');
  const [formality, setFormality] = useState<FormalityLevel>('smart_casual');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return closetItems.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;
      if (favoritesOnly && !item.isFavorite) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.colorName.toLowerCase().includes(q) ||
        (item.fabric || '').toLowerCase().includes(q)
      );
    });
  }, [closetItems, activeCategory, favoritesOnly, searchQuery]);

  const handleLoadStarterCapsule = () => {
    STARTER_CAPSULE_ITEMS.forEach((template, idx) => {
      const exists = closetItems.some(
        (existing) => existing.name.toLowerCase() === template.name.toLowerCase()
      );
      if (!exists) {
        onAddItem({
          ...template,
          id: `item_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date(Date.now() - idx * 1000).toISOString(),
        });
      }
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmitNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: ClosetItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      category,
      colorName: colorName.trim() || 'Neutral',
      colorHex: /^#[0-9a-fA-F]{6}$/.test(colorHex) ? colorHex : '#2A4B7C',
      fabric: fabric.trim() || undefined,
      season: season.trim() || undefined,
      formality,
      notes: notes.trim() || undefined,
      imageUrl,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };

    onAddItem(newItem);
    setName('');
    setNotes('');
    setImageUrl(undefined);
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 dark:border-zinc-800 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-stone-950 dark:text-white">
            My Digital Closet
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {guestProfile.name}&apos;s cataloged garments ({closetItems.length} pieces) · Ready for Closet-Only AI styling and Mix &amp; Match.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {closetItems.length < 4 && (
            <button
              type="button"
              onClick={handleLoadStarterCapsule}
              className="px-4 py-2 rounded-xl border border-stone-300 dark:border-zinc-700 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition cursor-pointer whitespace-nowrap"
            >
              Load 10-Piece Starter Capsule
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-950 dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 transition cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Garment</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-stone-950 text-white dark:bg-white dark:text-black'
                  : 'bg-stone-100 dark:bg-zinc-900 text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search garment, color, fabric..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-[#111216] border border-stone-200 dark:border-zinc-800 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-[#d48b55]"
            />
          </div>

          <button
            type="button"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            aria-pressed={favoritesOnly}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
              favoritesOnly
                ? 'border-blue-600 dark:border-[#d48b55] bg-blue-50/70 dark:bg-[#8c4a1e]/20 text-blue-800 dark:text-[#d48b55]'
                : 'border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-zinc-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Favorites</span>
          </button>
        </div>
      </div>

      {/* Closet Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-stone-50/60 dark:bg-[#111216] p-12 text-center space-y-4">
          <Shirt className="w-8 h-8 mx-auto text-stone-400" />
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-stone-900 dark:text-white">
              {closetItems.length === 0 ? 'Your digital closet is empty' : 'No matching garments'}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
              {closetItems.length === 0
                ? 'Add your own pieces or load a 10-piece minimalist starter capsule to unlock Closet-Only AI styling.'
                : 'Try clearing your search or switching category filters.'}
            </p>
          </div>
          {closetItems.length === 0 && (
            <div className="flex flex-wrap justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleLoadStarterCapsule}
                className="px-4 py-2 rounded-xl bg-blue-700 dark:bg-[#8c4a1e] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
              >
                Load Starter Capsule
              </button>
              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-zinc-700 text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer"
              >
                Add Custom Piece
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#111216] overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="h-36 relative border-b border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <span
                        className="w-12 h-12 rounded-xl border border-black/10 shadow-2xs"
                        style={{ backgroundColor: item.colorHex }}
                      />
                      <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                        {item.colorHex}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onToggleFavorite(item.id)}
                    aria-label={item.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/90 dark:bg-black/75 border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-stone-300 hover:text-red-500 transition cursor-pointer"
                  >
                    <Heart
                      className={`w-4 h-4 ${item.isFavorite ? 'fill-red-500 text-red-500' : ''}`}
                    />
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 capitalize">
                    {item.category.replace('_', ' ')} · {item.formality.replace('_', ' ')}
                    {item.fabric ? ` · ${item.fabric}` : ''}
                  </div>
                  <h3 className="text-sm font-semibold text-stone-950 dark:text-white leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    {item.colorName}
                    {item.season ? ` · ${item.season}` : ''}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 pt-0.5">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 border-t border-stone-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onStyleItemInChat(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-950 dark:bg-white text-white dark:text-black text-[11px] font-semibold hover:opacity-90 transition cursor-pointer whitespace-nowrap"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Style in Chat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenInOutfitBuilder(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 text-[11px] font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-zinc-800 transition cursor-pointer whitespace-nowrap"
                  >
                    <Layers className="w-3 h-3" />
                    <span>Builder</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  aria-label={`Delete ${item.name}`}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Add Garment Modal */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-garment-title"
        >
          <form
            onSubmit={handleSubmitNewItem}
            className="w-full max-w-lg bg-white dark:bg-[#111216] border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 id="add-garment-title" className="text-base font-bold text-stone-950 dark:text-white">
                Add Garment to Closet
              </h2>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                aria-label="Close add garment modal"
                className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Garment Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Navy Merino Crewneck Sweater"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 text-sm text-stone-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ClosetCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 text-sm text-stone-900 dark:text-white"
                  >
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Formality
                  </label>
                  <select
                    value={formality}
                    onChange={(e) => setFormality(e.target.value as FormalityLevel)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 text-sm text-stone-900 dark:text-white"
                  >
                    {FORMALITY_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Color &amp; Swatch
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setColorName(preset.name);
                        setColorHex(preset.hex);
                      }}
                      title={preset.name}
                      className={`w-7 h-7 rounded-lg border transition cursor-pointer ${
                        colorHex.toLowerCase() === preset.hex.toLowerCase()
                          ? 'ring-2 ring-blue-600 dark:ring-[#d48b55] border-white'
                          : 'border-stone-300 dark:border-zinc-700'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    placeholder="Color name"
                    className="col-span-2 px-3 py-2 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 text-sm text-stone-900 dark:text-white"
                  />
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    aria-label="Pick garment color"
                    className="w-full h-10 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 p-1 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Fabric / Material
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    placeholder="e.g., Merino Wool"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 text-sm text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Season
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    placeholder="All Seasons"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 text-sm text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Photo (optional)
                </label>
                <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-stone-300 dark:border-zinc-700 text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-zinc-900 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>{imageUrl ? 'Photo attached (click to replace)' : 'Upload garment photo'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Fit / Styling Notes
                </label>
                <textarea
                  rows={2}
                  maxLength={400}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Slightly relaxed cut; works best tucked or layered."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 text-sm text-stone-900 dark:text-white"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-stone-200 dark:border-zinc-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-stone-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-stone-950 dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 cursor-pointer"
              >
                Save Garment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
