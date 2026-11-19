import {
  ClosetItem,
  ExpertStylist,
  FormalityLevel,
  OccasionOption,
  UndertoneType,
  WeatherCondition,
} from '../types';

export const HERO_ATELIER_IMAGE = '/assets/aistudio/image_9b789caf.png';

export const EXPERTS: ExpertStylist[] = [
  {
    id: 'aria-chen',
    name: 'Aria Chen',
    role: 'Architectural Minimalist',
    specialty: 'Capsule Silhouettes & Proportion',
    avatar: '/src/assets/images/stylist_aria_chen_1794598622045.jpg',
    bio: 'Focuses on clean-lined everyday capsules, intentional negative space, and effortless 3-piece layering.',
    tone: 'Calm, structured, and concise',
    signatureAdvice: 'Anchor relaxed tops with structured bottoms or cropped outerwear to keep proportions sharp.',
    suggestedPrompts: [
      'Build a sharp 3-piece minimalist outfit for today',
      'How should I balance an oversized shirt with trousers?',
      'Suggest a monochrome look that avoids looking flat',
    ],
  },
  {
    id: 'marcus-vance',
    name: 'Marcus Vance',
    role: 'Tailoring & Smart-Casual Director',
    specialty: 'Elevated Workwear & Fit Calibration',
    avatar: '/src/assets/images/stylist_marcus_vance_1794598622501.jpg',
    bio: 'Specializes in relaxed tailoring, breathable knitwear, and polished shoes that transition from studio to dinner.',
    tone: 'Direct, practical, and detail-oriented',
    signatureAdvice: 'Let shoulder seam alignment and trouser break do 80% of the work before adding accessories.',
    suggestedPrompts: [
      'Put together a smart-casual outfit for a client presentation',
      'What shoes elevate dark chinos without feeling stiff?',
      'How do I layer knitwear under a blazer cleanly?',
    ],
  },
  {
    id: 'elena-rostova',
    name: 'Elena Rostova',
    role: 'Color & Undertone Strategist',
    specialty: 'Monk Scale Contrast & Seasonal Palettes',
    avatar: '/src/assets/images/stylist_elena_rostova_1794598622361.jpg',
    bio: 'Calibrates garment contrast, metal hardware, and fabric warmth to complement your natural Monk Skin Tone.',
    tone: 'Warm, analytical, and encouraging',
    signatureAdvice: 'Match collar and top hues to your undertone first; let trousers carry neutral contrast.',
    suggestedPrompts: [
      'Which shirt colors brighten my undertone best?',
      'Should I wear silver or gold hardware with navy and cream?',
      'Recommend a warm-neutral palette for evening plans',
    ],
  },
  {
    id: 'devon-brooks',
    name: 'Devon Brooks',
    role: 'Contemporary Everyday Stylist',
    specialty: 'Texture Mixing & Weather Layering',
    avatar: '/src/assets/images/stylist_devon_brooks_1794598622705.jpg',
    bio: 'Combines heavyweight cottons, raw denim, overshirts, and technical outerwear for durable daily comfort.',
    tone: 'Modern, approachable, and versatile',
    signatureAdvice: 'Pair contrasting textures—like brushed twill over smooth poplin—when keeping colors restrained.',
    suggestedPrompts: [
      'Style a relaxed weekend look with texture contrast',
      'What lightweight jacket works for unpredictable rain?',
      'Refresh my denim-and-tee combo so it looks intentional',
    ],
  },
];

export const OCCASIONS: OccasionOption[] = [
  {
    id: 'everyday-campus',
    label: 'Everyday & Campus',
    description: 'Breathable daily layers built for long walks and comfort',
    defaultFormality: 'casual',
  },
  {
    id: 'work-presentation',
    label: 'Work & Presentations',
    description: 'Clean collars, sharp proportions, and confident polish',
    defaultFormality: 'business_casual',
  },
  {
    id: 'coffee-weekend',
    label: 'Coffee & Weekend',
    description: 'Relaxed silhouettes with deliberate color and texture',
    defaultFormality: 'casual',
  },
  {
    id: 'dinner-evening',
    label: 'Dinner & Evening',
    description: 'Richer tones, subtle sheen, and refined footwear',
    defaultFormality: 'smart_casual',
  },
  {
    id: 'formal-celebration',
    label: 'Formal & Celebrations',
    description: 'Structured tailoring and high-contrast evening poise',
    defaultFormality: 'formal_evening',
  },
  {
    id: 'travel-transit',
    label: 'Travel & Transit',
    description: 'Crease-resistant fabrics and modular layering',
    defaultFormality: 'casual',
  },
];

export const WEATHER_OPTIONS: { id: WeatherCondition; label: string; shortNote: string }[] = [
  { id: 'sunny_warm', label: 'Warm & Sunny', shortNote: 'Lightweight breathable weaves' },
  { id: 'mild_breeze', label: 'Mild Breeze', shortNote: 'Light overshirt or knit layer' },
  { id: 'rainy_humid', label: 'Rainy & Humid', shortNote: 'Water-resistant outer & cropped hem' },
  { id: 'cold_layered', label: 'Cold & Crisp', shortNote: 'Thermal base, mid-knit & coat' },
  { id: 'indoor_ac', label: 'Indoor AC', shortNote: 'Cardigan or unstructured jacket' },
];

export const FORMALITY_OPTIONS: { id: FormalityLevel; label: string }[] = [
  { id: 'casual', label: 'Casual' },
  { id: 'smart_casual', label: 'Smart Casual' },
  { id: 'business_casual', label: 'Business Casual' },
  { id: 'formal_evening', label: 'Formal' },
];

export interface MonkToneSpec {
  scale: number;
  label: string;
  hex: string;
  contrastLevel: string;
  bestNeutrals: string[];
  accentColors: string[];
}

export const MONK_SKIN_TONES: MonkToneSpec[] = [
  { scale: 1, label: 'MST 1 — Porcelain Ivory', hex: '#F6EDE4', contrastLevel: 'Soft–Medium', bestNeutrals: ['Charcoal', 'Navy', 'Taupe'], accentColors: ['Slate Blue', 'Dusty Rose', 'Sage'] },
  { scale: 2, label: 'MST 2 — Alabaster Sand', hex: '#F3E7DB', contrastLevel: 'Soft–Medium', bestNeutrals: ['Stone', 'Espresso', 'Midnight'], accentColors: ['Oxford Blue', 'Forest Green', 'Burgundy'] },
  { scale: 3, label: 'MST 3 — Warm Bisque', hex: '#F7EAD0', contrastLevel: 'Medium', bestNeutrals: ['Camel', 'Slate', 'Off-White'], accentColors: ['Cobalt', 'Terracotta', 'Olive'] },
  { scale: 4, label: 'MST 4 — Golden Beige', hex: '#EADABA', contrastLevel: 'Medium', bestNeutrals: ['Chocolate', 'Chalk', 'Heather Grey'], accentColors: ['Teal', 'Rust', 'Royal Navy'] },
  { scale: 5, label: 'MST 5 — Amber Wheat', hex: '#D7BD96', contrastLevel: 'Medium–High', bestNeutrals: ['Ecru', 'Espresso', 'Deep Navy'], accentColors: ['Saddle Brown', 'Emerald', 'Crimson'] },
  { scale: 6, label: 'MST 6 — Warm Honey', hex: '#A07E56', contrastLevel: 'High', bestNeutrals: ['Crisp White', 'Charcoal', 'Sand'], accentColors: ['Cobalt Blue', 'Mustard', 'Pine'] },
  { scale: 7, label: 'MST 7 — Rich Bronze', hex: '#825C43', contrastLevel: 'High', bestNeutrals: ['Ivory', 'Black', 'Oatmeal'], accentColors: ['Warm Ochre', 'Sky Blue', 'Olive'] },
  { scale: 8, label: 'MST 8 — Deep Chestnut', hex: '#604134', contrastLevel: 'High', bestNeutrals: ['Chalk White', 'Warm Grey', 'Camel'], accentColors: ['Cobalt', 'Amber', 'Mint'] },
  { scale: 9, label: 'MST 9 — Espresso Umber', hex: '#3A312A', contrastLevel: 'High Luminous', bestNeutrals: ['Off-White', 'Stone', 'Silver Grey'], accentColors: ['Saffron', 'Ice Blue', 'Burgundy'] },
  { scale: 10, label: 'MST 10 — Obsidian Ebony', hex: '#292420', contrastLevel: 'High Luminous', bestNeutrals: ['Pure White', 'Pearl', 'Sandstone'], accentColors: ['Cobalt', 'Emerald', 'Coral'] },
];

export const UNDERTONE_PALETTES: Record<UndertoneType, { summary: string; metals: string; idealColors: string[]; cautionColors: string[] }> = {
  warm: {
    summary: 'Golden, peachy, or yellow base undertones thrive in earthy warmth and creamy whites.',
    metals: 'Brushed Brass, Gold, Aged Bronze',
    idealColors: ['Cream', 'Camel', 'Olive', 'Saddle Brown', 'Warm Navy', 'Terracotta'],
    cautionColors: ['Icy Neon Pink', 'Stark Blue-Grey', 'Optic Acid Yellow'],
  },
  cool: {
    summary: 'Rosy, pink, or blue base undertones shine in crisp whites, slate blues, and jewel tones.',
    metals: 'Brushed Silver, Platinum, Gunmetal',
    idealColors: ['Crisp White', 'Oxford Blue', 'Charcoal', 'Burgundy', 'Pine Green', 'Plum'],
    cautionColors: ['Mustard Orange', 'Warm Beige-Yellow', 'Muddy Khaki'],
  },
  neutral: {
    summary: 'Balanced undertones bridge both warm earths and cool blues effortlessly with medium contrast.',
    metals: 'Mixed Champagne Gold or Matte Steel',
    idealColors: ['Off-White', 'Oxford Blue', 'Taupe', 'Forest Green', 'Espresso', 'Charcoal'],
    cautionColors: ['Overly Fluorescent Neons', 'Washed-out Chalk Yellow'],
  },
  olive: {
    summary: 'Green-neutral undertones pair seamlessly with muted earth tones, deep jewel hues, and soft ivory.',
    metals: 'Antique Gold, Champagne, Brushed Nickel',
    idealColors: ['Ivory', 'Aubergine', 'Forest Olive', 'Deep Navy', 'Cognac', 'Slate'],
    cautionColors: ['Pale Mint-Pastel', 'Chartreuse', 'Dusty Orange-Tan'],
  },
};

export const STARTER_CAPSULE_ITEMS: Omit<ClosetItem, 'id' | 'createdAt'>[] = [
  {
    name: 'Heavyweight Chalk Tee',
    category: 'tops',
    colorName: 'Chalk White',
    colorHex: '#F4F4F0',
    fabric: '260gsm Combed Cotton',
    season: 'All Seasons',
    formality: 'casual',
    notes: 'Clean crew neck base layer for standalone or under-jacket styling.',
    isFavorite: true,
  },
  {
    name: 'Oxford Button-Down Shirt',
    category: 'tops',
    colorName: 'Oxford Blue',
    colorHex: '#2A4B7C',
    fabric: 'Cotton Oxford',
    season: 'All Seasons',
    formality: 'smart_casual',
    notes: 'Versatile collar that works tucked with chinos or open over a tee.',
    isFavorite: true,
  },
  {
    name: 'Merino Knit Polo',
    category: 'tops',
    colorName: 'Olive Moss',
    colorHex: '#5A6344',
    fabric: 'Fine Merino Wool',
    season: 'Spring / Autumn',
    formality: 'smart_casual',
    notes: 'Breathable drape with subtle texture contrast.',
    isFavorite: false,
  },
  {
    name: 'Relaxed Straight Selvedge Denim',
    category: 'bottoms',
    colorName: 'Deep Indigo',
    colorHex: '#1D293D',
    fabric: '13oz Raw Denim',
    season: 'All Seasons',
    formality: 'casual',
    notes: 'Clean hem without distressing; pairs across tops.',
    isFavorite: true,
  },
  {
    name: 'Pleated Wool-Blend Trousers',
    category: 'bottoms',
    colorName: 'Charcoal Slate',
    colorHex: '#2F3337',
    fabric: 'Tropical Wool Blend',
    season: 'All Seasons',
    formality: 'business_casual',
    notes: 'High-drape leg line for elevated work and dinner pairings.',
    isFavorite: false,
  },
  {
    name: 'Unstructured Linen-Cotton Blazer',
    category: 'outerwear',
    colorName: 'Warm Sandstone',
    colorHex: '#C7B8A1',
    fabric: 'Linen & Cotton',
    season: 'Spring / Summer',
    formality: 'business_casual',
    notes: 'Soft shoulder silhouette for effortless layering.',
    isFavorite: true,
  },
  {
    name: 'Twill Chore Overshirt',
    category: 'outerwear',
    colorName: 'Saddle Brown',
    colorHex: '#7A4928',
    fabric: 'Brushed Cotton Twill',
    season: 'Autumn / Winter',
    formality: 'casual',
    notes: 'Adds rugged structure over tees and knitwear.',
    isFavorite: false,
  },
  {
    name: 'Minimalist Leather Sneakers',
    category: 'footwear',
    colorName: 'Ivory Chalk',
    colorHex: '#EFECE6',
    fabric: 'Full-Grain Calfskin',
    season: 'All Seasons',
    formality: 'casual',
    notes: 'Low-profile cupsole suited for denim and relaxed trousers.',
    isFavorite: true,
  },
  {
    name: 'Suede Penny Loafers',
    category: 'footwear',
    colorName: 'Espresso Suede',
    colorHex: '#4A3428',
    fabric: 'Water-Repellent Suede',
    season: 'Spring / Autumn',
    formality: 'smart_casual',
    notes: 'Bridges smart-casual and tailored evening wear.',
    isFavorite: false,
  },
  {
    name: 'Brushed Steel Field Watch',
    category: 'accessories',
    colorName: 'Brushed Steel',
    colorHex: '#8E949B',
    fabric: 'Stainless Steel & Leather',
    season: 'All Seasons',
    formality: 'smart_casual',
    notes: 'Subtle wrist proportion anchor.',
    isFavorite: false,
  },
];
