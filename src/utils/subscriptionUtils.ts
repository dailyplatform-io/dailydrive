/**
 * Enhanced utility functions for handling subscription and trial management
 * Provides type-safe, centralized functions for subscription state management
 */

export interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
  surname?: string;
  isInTrial?: boolean;
  trialEndsAt?: string;
  TrialEndsAt?: string;
  subscriptionStatus?: string;
  isSubscribed?: boolean;
  isActive?: boolean;
  IsActive?: boolean | number;
  subscriptionTier?: string;
  SubscriptionTier?: string;
  subscriptionPriceEur?: number;
  SubscriptionPriceEur?: number;
  paymentCompleted?: boolean | number;
  PaymentCompleted?: boolean | number;
  paymentMethod?: string;
  PaymentMethod?: string;
  subscriptionActivatedAt?: string;
  [key: string]: any;
}

export interface TrialInfo {
  isInTrial: boolean;
  daysLeft: number;
  trialEndsAt?: string;
  hasExpired: boolean;
}

export interface SubscriptionInfo {
  hasActiveSubscription: boolean;
  subscriptionTier?: string;
  paymentMethod?: string;
  subscriptionPriceEur?: number;
  subscriptionStatus?: string;
}

/**
 * Normalizes user data from different property name variations
 * Handles inconsistencies between Pascal and camel case properties
 */
export const normalizeAuthUser = (authUser: AuthUser): {
  paymentMethod: string | undefined;
  paymentCompleted: boolean;
  isActive: boolean;
  trialEndsAt: string | undefined;
  subscriptionTier: string;
  subscriptionPriceEur: number;
  subscriptionStatus: string | undefined;
  isSubscribed: boolean;
  isInTrial: boolean;
} => {
  return {
    paymentMethod: authUser.PaymentMethod || authUser.paymentMethod,
    paymentCompleted: Boolean(
      authUser.PaymentCompleted === true || 
      authUser.PaymentCompleted === 1 || 
      authUser.paymentCompleted === true || 
      authUser.paymentCompleted === 1
    ),
    isActive: Boolean(
      authUser.IsActive === true || 
      authUser.IsActive === 1 || 
      authUser.isActive === true
    ),
    trialEndsAt: authUser.trialEndsAt || authUser.TrialEndsAt,
    subscriptionTier: authUser.SubscriptionTier || authUser.subscriptionTier || 'premium',
    subscriptionPriceEur: authUser.subscriptionPriceEur || authUser.SubscriptionPriceEur || 0,
    subscriptionStatus: authUser.subscriptionStatus,
    isSubscribed: Boolean(authUser.isSubscribed),
    isInTrial: Boolean(authUser.isInTrial),
  };
};

/**
 * Gets authenticated user from storage with error handling
 */
export const getAuthUserFromStorage = (): AuthUser | null => {
  try {
    const authUserStr = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    return authUserStr ? JSON.parse(authUserStr) : null;
  } catch (error) {
    console.error('Error parsing auth user from storage:', error);
    return null;
  }
};

/**
 * Updates authenticated user in both storage locations
 */
export const updateAuthUserInStorage = (updatedUser: AuthUser): void => {
  try {
    const userStr = JSON.stringify(updatedUser);
    localStorage.setItem('authUser', userStr);
    if (sessionStorage.getItem('authUser')) {
      sessionStorage.setItem('authUser', userStr);
    }
  } catch (error) {
    console.error('Error updating auth user in storage:', error);
  }
};

/**
 * Calculates trial information from trial end date
 */
export const calculateTrialInfo = (trialEndsAt?: string): TrialInfo => {
  if (!trialEndsAt) {
    return {
      isInTrial: false,
      daysLeft: 0,
      hasExpired: false,
    };
  }

  try {
    const trialEnd = new Date(trialEndsAt);
    const now = new Date();
    const timeDifference = trialEnd.getTime() - now.getTime();
    const daysLeft = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

    return {
      isInTrial: timeDifference > 0,
      daysLeft: Math.max(0, daysLeft),
      trialEndsAt,
      hasExpired: timeDifference <= 0,
    };
  } catch (error) {
    console.error('Error calculating trial info:', error);
    return {
      isInTrial: false,
      daysLeft: 0,
      hasExpired: true,
    };
  }
};

/**
 * Checks if user has an active paid subscription (not trial)
 */
export const checkActiveSubscription = (): SubscriptionInfo => {
  const authUser = getAuthUserFromStorage();
  if (!authUser) {
    return { hasActiveSubscription: false };
  }

  const normalized = normalizeAuthUser(authUser);
  
  // Check for active paid subscription
  const hasActivePaidSubscription: boolean = Boolean(
    normalized.paymentCompleted && 
    normalized.paymentMethod && 
    !['Free', 'free', null, ''].includes(normalized.paymentMethod as string)
  );

  return {
    hasActiveSubscription: hasActivePaidSubscription,
    subscriptionTier: normalized.subscriptionTier,
    paymentMethod: normalized.paymentMethod,
    subscriptionPriceEur: normalized.subscriptionPriceEur,
    subscriptionStatus: normalized.subscriptionStatus,
  };
};

/**
 * Handles successful payment completion - transitions user from trial to active subscription
 */
export const handleSuccessfulPayment = (
  subscriptionTier: string = 'premium',
  subscriptionPrice: number = 0
): void => {
  try {
    const authUser = getAuthUserFromStorage();
    if (!authUser) {
      console.error('No auth user found in storage');
      return;
    }
    
    // Update user to active subscription status
    const updatedAuthUser: AuthUser = {
      ...authUser,
      // Clear trial data
      isInTrial: false,
      trialEndsAt: undefined,
      TrialEndsAt: undefined,
      // Set active subscription
      isActive: true,
      IsActive: true,
      isSubscribed: true,
      subscriptionStatus: 'active',
      subscriptionTier: subscriptionTier,
      SubscriptionTier: subscriptionTier,
      subscriptionPriceEur: subscriptionPrice,
      SubscriptionPriceEur: subscriptionPrice,
      // Add payment timestamp
      subscriptionActivatedAt: new Date().toISOString()
    };

    updateAuthUserInStorage(updatedAuthUser);
    console.log('Successfully transitioned user from trial to active subscription');
    
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
};

/**
 * Checks if user has an active subscription (updated to use new utilities)
 */
export const hasActiveSubscription = (): boolean => {
  return checkActiveSubscription().hasActiveSubscription;
};

/**
 * Checks if user is in an active trial period (updated to use new utilities)
 */
export const hasActiveTrial = (): { isActive: boolean; daysLeft?: number } => {
  const authUser = getAuthUserFromStorage();
  if (!authUser) return { isActive: false };

  const normalized = normalizeAuthUser(authUser);
  const trialInfo = calculateTrialInfo(normalized.trialEndsAt);
  
  return {
    isActive: trialInfo.isInTrial,
    daysLeft: trialInfo.daysLeft
  };
};

/**
 * Sets user to inactive status (called when trial expires)
 */
export const setUserInactive = (): void => {
  try {
    const authUser = getAuthUserFromStorage();
    if (!authUser) return;
    
    const updatedAuthUser: AuthUser = {
      ...authUser,
      isActive: false,
      IsActive: false,
      isInTrial: false,
      subscriptionStatus: 'expired'
    };

    updateAuthUserInStorage(updatedAuthUser);
    console.log('User set to inactive status due to trial expiration');
    
  } catch (error) {
    console.error('Error setting user inactive:', error);
  }
};

/**
 * Determines if user should be redirected to payment page
 * Considers trial expiration and subscription status
 */
export const shouldRedirectToPayment = (): boolean => {
  const authUser = getAuthUserFromStorage();
  if (!authUser) return false;

  const subscriptionInfo = checkActiveSubscription();
  if (subscriptionInfo.hasActiveSubscription) return false;

  const normalized = normalizeAuthUser(authUser);
  const trialInfo = calculateTrialInfo(normalized.trialEndsAt);
  
  // Redirect if trial has expired or user has no trial/subscription
  return trialInfo.hasExpired || (!trialInfo.isInTrial && !subscriptionInfo.hasActiveSubscription);
};