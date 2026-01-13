import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setUserInactive } from '../utils/subscriptionUtils';

export interface TrialStatus {
  isInTrial: boolean;
  daysLeft: number;
  trialEndsAt?: string;
  hasExpired: boolean;
}

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  paymentMethod?: string;
  subscriptionTier?: string;
  subscriptionPriceEur?: number;
}

export interface UserTrialData {
  trial: TrialStatus;
  subscription: SubscriptionStatus;
  isLoading: boolean;
  shouldRedirectToPayment: boolean;
}

/**
 * Centralized hook for managing trial and subscription status
 * Handles all trial logic, validation, and navigation
 */
export const useTrialManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [trialData, setTrialData] = useState<UserTrialData>({
    trial: {
      isInTrial: false,
      daysLeft: 0,
      hasExpired: false,
    },
    subscription: {
      hasActiveSubscription: false,
    },
    isLoading: true,
    shouldRedirectToPayment: false,
  });

  const getUserFromStorage = useCallback(() => {
    const authUserStr = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    return authUserStr ? JSON.parse(authUserStr) : null;
  }, []);

  const updateUserInStorage = useCallback((updatedUser: any) => {
    localStorage.setItem('authUser', JSON.stringify(updatedUser));
    if (sessionStorage.getItem('authUser')) {
      sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
    }
  }, []);

  const normalizeUserData = useCallback((authUser: any) => {
    return {
      paymentMethod: authUser.PaymentMethod || authUser.paymentMethod,
      paymentCompleted: 
        authUser.PaymentCompleted === true || 
        authUser.PaymentCompleted === 1 || 
        authUser.paymentCompleted === true || 
        authUser.paymentCompleted === 1,
      isActive: 
        authUser.IsActive === true || 
        authUser.IsActive === 1 || 
        authUser.isActive === true,
      isInTrial: 
        authUser.IsInTrial === true || 
        authUser.IsInTrial === 1 || 
        authUser.isInTrial === true,
      trialEndsAt: authUser.trialEndsAt || authUser.TrialEndsAt,
      subscriptionTier: authUser.SubscriptionTier || authUser.subscriptionTier || 'free',
      subscriptionPriceEur: authUser.subscriptionPriceEur || authUser.SubscriptionPriceEur || 0,
    };
  }, []);

  const calculateTrialStatus = useCallback((trialEndsAt: string): TrialStatus => {
    if (!trialEndsAt) {
      return {
        isInTrial: false,
        daysLeft: 0,
        hasExpired: false,
      };
    }

    // Parse the trial end date and treat it as UTC if no timezone is specified
    const trialEnd = new Date(trialEndsAt.endsWith('Z') ? trialEndsAt : trialEndsAt + 'Z');
    const now = new Date();
    
    const timeDifference = trialEnd.getTime() - now.getTime();
    const daysLeft = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

    console.log('Trial calculation:', {
      originalTrialEnd: trialEndsAt,
      trialEndParsed: trialEnd.toISOString(),
      nowUTC: now.toISOString(),
      timeDifference,
      daysLeft,
      hasExpired: timeDifference <= 0
    });

    return {
      isInTrial: timeDifference > 0,
      daysLeft: Math.max(0, daysLeft),
      trialEndsAt,
      hasExpired: timeDifference <= 0,
    };
  }, []);

  const handleTrialExpiration = useCallback((authUser: any, normalizedData: any) => {
    console.log('Trial expired, setting user inactive and redirecting to payment');
    
    const updatedAuthUser = {
      ...authUser,
      isActive: false,
      IsActive: false,
      paymentCompleted: false,
      PaymentCompleted: false,
      subscriptionStatus: 'expired'
    };
    
    updateUserInStorage(updatedAuthUser);
    setUserInactive();
    
    // Navigate to payment with context
    navigate('/payment', {
      replace: true,
      state: {
        userId: user?.id,
        email: user?.email,
        firstName: user?.name,
        lastName: user?.surname,
        subscriptionTier: normalizedData.subscriptionTier,
        subscriptionPriceEur: normalizedData.subscriptionPriceEur,
        trialExpired: true,
      }
    });
  }, [navigate, user, updateUserInStorage]);

  const checkTrialAndSubscriptionStatus = useCallback(() => {
    const authUser = getUserFromStorage();
    if (!authUser) {
      setTrialData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const normalizedData = normalizeUserData(authUser);
      
      // Check for active paid subscription first
      const hasActivePaidSubscription = 
        normalizedData.paymentCompleted && 
        normalizedData.paymentMethod && 
        !['Free', 'free', null, '', undefined].includes(normalizedData.paymentMethod);

      if (hasActivePaidSubscription) {
        console.log('User has active paid subscription:', { 
          paymentMethod: normalizedData.paymentMethod, 
          paymentCompleted: normalizedData.paymentCompleted 
        });
        
        setTrialData({
          trial: {
            isInTrial: false,
            daysLeft: 0,
            hasExpired: false,
          },
          subscription: {
            hasActiveSubscription: true,
            paymentMethod: normalizedData.paymentMethod,
            subscriptionTier: normalizedData.subscriptionTier,
            subscriptionPriceEur: normalizedData.subscriptionPriceEur,
          },
          isLoading: false,
          shouldRedirectToPayment: false,
        });
        return;
      }

      // Check for trial users - trust backend's isInTrial value first
      if (normalizedData.isInTrial && normalizedData.trialEndsAt) {
        const trialStatus = calculateTrialStatus(normalizedData.trialEndsAt);
        
        console.log('Backend says user is in trial:', {
          backendIsInTrial: normalizedData.isInTrial,
          trialEnd: new Date(normalizedData.trialEndsAt).toISOString(),
          now: new Date().toISOString(),
          daysLeft: trialStatus.daysLeft,
          frontendCalculation: trialStatus.hasExpired
        });

        // Trust backend's trial status over frontend calculation
        const effectiveTrialStatus = {
          ...trialStatus,
          isInTrial: true, // Trust backend
          hasExpired: false // Backend says trial is active
        };

        setTrialData({
          trial: effectiveTrialStatus,
          subscription: {
            hasActiveSubscription: false,
            subscriptionTier: normalizedData.subscriptionTier,
            subscriptionPriceEur: normalizedData.subscriptionPriceEur,
          },
          isLoading: false,
          shouldRedirectToPayment: false,
        });
        return;
      }

      // Check for trial users with trial end date but backend says not in trial
      const hasTrialEndDate = !!normalizedData.trialEndsAt;
      const isTrialUser = hasTrialEndDate && !normalizedData.paymentCompleted;

      if (isTrialUser && !normalizedData.isInTrial) {
        const trialStatus = calculateTrialStatus(normalizedData.trialEndsAt);
        
        console.log('Trial user detected:', {
          trialEnd: new Date(normalizedData.trialEndsAt).toISOString(),
          now: new Date().toISOString(),
          daysLeft: trialStatus.daysLeft,
          hasExpired: trialStatus.hasExpired
        });

        if (trialStatus.hasExpired) {
          console.log('Trial expired - redirecting to payment');
          handleTrialExpiration(authUser, normalizedData);
          return;
        }

        setTrialData({
          trial: trialStatus,
          subscription: {
            hasActiveSubscription: false,
            subscriptionTier: normalizedData.subscriptionTier,
            subscriptionPriceEur: normalizedData.subscriptionPriceEur,
          },
          isLoading: false,
          shouldRedirectToPayment: false,
        });
        return;
      }

      // Handle edge case: user marked as in trial but improper configuration
      if (authUser.isInTrial) {
        console.warn('User marked as in trial but improper configuration found');
        handleTrialExpiration(authUser, normalizedData);
        return;
      }

      // Default: no trial or subscription
      setTrialData({
        trial: {
          isInTrial: false,
          daysLeft: 0,
          hasExpired: false,
        },
        subscription: {
          hasActiveSubscription: false,
        },
        isLoading: false,
        shouldRedirectToPayment: false,
      });

    } catch (error) {
      console.error('Error checking trial/subscription status:', error);
      setTrialData(prev => ({ ...prev, isLoading: false }));
    }
  }, [getUserFromStorage, normalizeUserData, calculateTrialStatus, handleTrialExpiration]);

  // Check trial status on mount and set up periodic checking
  useEffect(() => {
    if (!user) {
      setTrialData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    checkTrialAndSubscriptionStatus();
    
    // Check every minute for precise trial enforcement
    const interval = setInterval(checkTrialAndSubscriptionStatus, 60 * 1000);
    return () => clearInterval(interval);
  }, [user, checkTrialAndSubscriptionStatus]);

  const navigateToPayment = useCallback((isUpgrade = false) => {
    const authUser = getUserFromStorage();
    if (!authUser) return;

    const normalizedData = normalizeUserData(authUser);
    
    console.log('navigateToPayment - authUser:', authUser);
    console.log('navigateToPayment - normalizedData:', normalizedData);
    console.log('navigateToPayment - user context:', user);
    
    const paymentState = {
      userId: user?.id,
      email: user?.email,
      firstName: user?.name,
      lastName: user?.surname,
      subscriptionTier: normalizedData.subscriptionTier,
      subscriptionPriceEur: normalizedData.subscriptionPriceEur,
      isUpgrade,
    };
    
    console.log('navigateToPayment - payment state:', paymentState);
    
    navigate('/payment', {
      state: paymentState
    });
  }, [navigate, user, getUserFromStorage, normalizeUserData]);

  return {
    ...trialData,
    navigateToPayment,
    refreshStatus: checkTrialAndSubscriptionStatus,
  };
};
