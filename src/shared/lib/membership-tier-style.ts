export const MEMBERSHIP_TIER_GRADIENT_CLASS_NAMES = {
  BRONZE: 'from-stone-800 via-orange-700 to-stone-900',
  SILVER: 'from-zinc-700 via-zinc-400 to-zinc-700',
  GOLD: 'from-yellow-800 via-yellow-500 to-yellow-800',
  PLATINUM: 'from-slate-700 via-cyan-300 to-slate-700',
} as const;

export const MEMBERSHIP_TIER_BADGE_CLASS_NAMES = {
  BRONZE: 'border-orange-200 bg-orange-50 text-orange-900 hover:bg-orange-100 active:bg-orange-200',
  SILVER: 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 active:bg-zinc-300',
  GOLD: 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 active:bg-amber-200',
  PLATINUM: 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300',
} as const;
