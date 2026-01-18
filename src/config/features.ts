const readFlag = (value: string | undefined, fallback: boolean) => {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
};

export const features = {
  rent: readFlag(import.meta.env.VITE_FEATURE_RENT, false),
  buy: readFlag(import.meta.env.VITE_FEATURE_BUY, true),
  auctions: readFlag(import.meta.env.VITE_FEATURE_AUCTIONS, false),
  trial: readFlag(import.meta.env.VITE_FEATURE_TRIAL, true),
  subscriptions: readFlag(import.meta.env.VITE_FEATURE_SUBSCRIPTIONS, true),
} as const;

export type EnabledMode = 'rent' | 'buy';

export const getEnabledModes = (): EnabledMode[] => {
  const modes: EnabledMode[] = [];
  if (features.rent) modes.push('rent');
  if (features.buy) modes.push('buy');
  return modes;
};

export const getDefaultMode = (): EnabledMode | null => {
  const modes = getEnabledModes();
  return modes[0] ?? null;
};
