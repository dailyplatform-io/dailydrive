/**
 * Trial and subscription configuration constants
 */

export const TRIAL_CONFIG = {
  // Trial duration in days
  TRIAL_DURATION_DAYS: 7,
  
  // Check interval in milliseconds (1 minute)
  STATUS_CHECK_INTERVAL: 60 * 1000,
  
  // Days remaining to show urgency banner
  URGENCY_THRESHOLD_DAYS: 3,
  
  // Default redirect delay after payment
  PAYMENT_REDIRECT_DELAY: 5000,
  
  // Free trial payment methods
  FREE_PAYMENT_METHODS: ['Free', 'free', null, ''],
} as const;

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  TRIAL: 'trial',
  PENDING: 'pending',
} as const;

export const PRICING_TIERS = {
  free: { price: 0, label: 'Free (2 cars)' },
  basic5: { price: 180, label: 'Basic 5' },
  plus10: { price: 250, label: 'Plus 10' },
  standard20: { price: 350, label: 'Standard 20' },
  pro20plus: { price: 450, label: 'Pro 20+' },
} as const;

/**
 * Helper function to get pricing tier info
 */
export const getPricingTierInfo = (tier: string) => {
  return PRICING_TIERS[tier as keyof typeof PRICING_TIERS] || 
         { price: 0, label: 'Unknown Plan' };
};

/**
 * Helper function to format currency
 */
export const formatCurrency = (amount: number, currency = 'EUR') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};
