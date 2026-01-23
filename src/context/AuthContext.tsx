import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getOwnerCars } from '../service/carService';
import { authService as refreshTokenAuthService } from '../services/authService';
import { getCurrentAuthToken, clearAuthTokens } from '../utils/tokenUtils';
import { normalizeInstagramHandle, slugifySellerName } from '../utils/slug';

export type OwnerProfileType = 'rent' | 'buy';

export type SubscriptionTier = 'free' | 'basic5' | 'plus10' | 'standard20' | 'pro20plus';

export interface OwnerLocation {
  address: string;
  city: string;
  lat: number;
  lng: number;
}

export interface OwnerAccount {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  sellerName?: string;
  sellerSlug?: string;
  instagramName?: string;
  facebookName?: string;
  isPrivateOwner?: boolean;
  profileType: OwnerProfileType;
  subscriptionTier: SubscriptionTier;
  subscriptionStartedAt: string;
  subscriptionEndsAt: string;
  subscriptionPaidEur: number;
  subscriptionPendingTier?: SubscriptionTier;
  subscriptionPendingStartsAt?: string;
  location: OwnerLocation;
  createdAt: string;
}

interface StoredUser extends OwnerAccount {
  password: string;
}

interface AuthContextValue {
  user: OwnerAccount | null;
  token: string | null;
  login: (email: string, password: string) => { ok: true } | { ok: false; error: 'invalid' };
  logout: () => void;
  register: (input: {
    name: string;
    surname: string;
    email: string;
    phone: string;
    sellerName: string;
    instagramName?: string;
    facebookName?: string;
    profileType: OwnerProfileType;
    subscriptionTier: SubscriptionTier;
    location: OwnerLocation;
    password: string;
  }) => { ok: true } | { ok: false; error: 'email_taken' };
  updatePassword: (currentPassword: string, nextPassword: string) => { ok: true } | { ok: false; error: 'invalid' };
  refreshToken: () => string | null;
  hasValidToken: () => boolean;
  upgradeSubscriptionTier: (tier: SubscriptionTier) =>
    | { ok: true; dueNowEur: number }
    | { ok: false; error: 'not_logged_in' | 'invalid_tier' };
  scheduleDowngradeTier: (tier: SubscriptionTier) =>
    | { ok: true; startsAt: string }
    | { ok: false; error: 'not_logged_in' | 'too_many_cars' | 'invalid_tier' };
  cancelScheduledTierChange: () => { ok: true } | { ok: false; error: 'not_logged_in' };
  setUserFromApi: (user: OwnerAccount) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USERS_KEY = 'dailydrive.ownerUsers';
const SESSION_KEY = 'dailydrive.ownerSession';

function safeParseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readUsers(): StoredUser[] {
  return safeParseJSON<StoredUser[]>(localStorage.getItem(USERS_KEY), []);
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readSessionUserId(): string | null {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw || null;
}

function writeSessionUserId(userId: string | null) {
  if (!userId) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, userId);
}

function toPublicUser(user: StoredUser): OwnerAccount {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...publicUser } = user;
  return publicUser;
}

export function annualPriceEur(profileType: OwnerProfileType, tier: SubscriptionTier) {
  if (tier === 'free') return 0;
  if (tier === 'basic5') return 180;
  if (tier === 'plus10') return 250;
  if (tier === 'standard20') return 350;
  return 450;
}

export function maxCarsForTier(tier: SubscriptionTier) {
  if (tier === 'free') return 2;
  if (tier === 'basic5') return 5;
  if (tier === 'plus10') return 10;
  if (tier === 'standard20') return 20;
  return Number.POSITIVE_INFINITY;
}

function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function billableCarsCount(profileType: OwnerProfileType, ownerCars: Array<{ listingStatus?: string; isForSale?: boolean }>) {
  const nonDeleted = ownerCars.filter((c) => c.listingStatus !== 'deleted');
  if (profileType === 'rent') return nonDeleted.length;
  return nonDeleted.filter((c) => c.isForSale && c.listingStatus === 'active').length;
}

function normalizeSubscription(user: StoredUser): StoredUser {
  const created = new Date(user.subscriptionStartedAt || user.createdAt || Date.now());
  const startedAt = Number.isNaN(created.valueOf()) ? new Date().toISOString() : created.toISOString();

  const ends = new Date(user.subscriptionEndsAt || '');
  const endsAt = Number.isNaN(ends.valueOf()) ? addYears(new Date(startedAt), 1).toISOString() : ends.toISOString();

  const paidEur =
    typeof user.subscriptionPaidEur === 'number'
      ? user.subscriptionPaidEur
      : annualPriceEur(user.profileType, user.subscriptionTier);

  return {
    ...user,
    subscriptionStartedAt: startedAt,
    subscriptionEndsAt: endsAt,
    subscriptionPaidEur: paidEur,
  };
}

function ensureSubscriptionUpToDate(user: StoredUser): StoredUser {
  const normalized = normalizeSubscription(user);
  const now = new Date();
  const ends = new Date(normalized.subscriptionEndsAt);
  if (ends > now) return normalized;

  const nextTier = normalized.subscriptionPendingTier ?? normalized.subscriptionTier;
  const nextStart = now.toISOString();
  const nextEnd = addYears(now, 1).toISOString();
  return {
    ...normalized,
    subscriptionTier: nextTier,
    subscriptionStartedAt: nextStart,
    subscriptionEndsAt: nextEnd,
    subscriptionPaidEur: annualPriceEur(normalized.profileType, nextTier),
    subscriptionPendingTier: undefined,
    subscriptionPendingStartsAt: undefined,
  };
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<OwnerAccount | null>(() => {
    const sessionId = readSessionUserId();
    if (!sessionId) return null;
    const users = readUsers();
    const idx = users.findIndex((u) => u.id === sessionId);
    if (idx === -1) return null;
    const updated = ensureSubscriptionUpToDate(users[idx]);
    if (updated !== users[idx]) writeUsers(users.map((u, i) => (i === idx ? updated : u)));
    return toPublicUser(updated);
  });
  
  const [token, setToken] = useState<string | null>(() => {
    return getCurrentAuthToken();
  });

  // Enhanced refresh mechanism with automatic token validation
  const refreshToken = useCallback(() => {
    const currentToken = getCurrentAuthToken();
    if (currentToken && currentToken !== token) {
      setToken(currentToken);
    }
    return currentToken;
  }, [token]);

  // Check if user has a valid authentication token
  const hasValidToken = useCallback(() => {
    const currentToken = getCurrentAuthToken();
    return !!currentToken;
  }, []);

  const login = useCallback<AuthContextValue['login']>((email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const users = readUsers();
    const idx = users.findIndex((u) => u.email.trim().toLowerCase() === normalizedEmail);
    const found = idx === -1 ? undefined : users[idx];
    if (!found || found.password !== password) return { ok: false, error: 'invalid' };
    const updated = ensureSubscriptionUpToDate(found);
    if (updated !== found) writeUsers(users.map((u, i) => (i === idx ? updated : u)));
    writeSessionUserId(updated.id);
    
    // Generate a simple token for API authentication
    const authToken = `demo-token-${updated.id}-${Date.now()}`;
    localStorage.setItem('authToken', authToken);
    setToken(authToken);
    
    setUser(toPublicUser(updated));
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    try {
      // Attempt to logout via refresh token service (for real auth)
      await refreshTokenAuthService.logout();
    } catch (error) {
      console.warn('Service logout failed, continuing with local cleanup:', error);
    } finally {
      // Always perform local cleanup
      setUser(null);
      setToken(null);
      writeSessionUserId(null);
      clearAuthTokens(); // Use centralized token clearing
    }
  }, []);

  const register = useCallback<AuthContextValue['register']>((input) => {
    const users = readUsers();
    const normalizedEmail = input.email.trim().toLowerCase();
    const exists = users.some((u) => u.email.trim().toLowerCase() === normalizedEmail);
    if (exists) return { ok: false, error: 'email_taken' };

    const nowDate = new Date();
    const now = nowDate.toISOString();
    const endsAt = addYears(nowDate, 1).toISOString();
    const id = crypto.randomUUID();
    const sellerSlug = slugifySellerName(input.sellerName);
    const instagramHandle = normalizeInstagramHandle(input.instagramName ?? '');
    const next: StoredUser = {
      id,
      name: input.name.trim(),
      surname: input.surname.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      sellerName: input.sellerName.trim(),
      sellerSlug: sellerSlug || undefined,
      instagramName: instagramHandle || undefined,
      facebookName: input.facebookName?.trim() || undefined,
      profileType: input.profileType,
      subscriptionTier: input.subscriptionTier,
      subscriptionStartedAt: now,
      subscriptionEndsAt: endsAt,
      subscriptionPaidEur: annualPriceEur(input.profileType, input.subscriptionTier),
      location: input.location,
      createdAt: now,
      password: input.password,
    };

    writeUsers([next, ...users]);
    writeSessionUserId(next.id);
    
    // Generate a simple token for API authentication
    const authToken = `demo-token-${next.id}-${Date.now()}`;
    localStorage.setItem('authToken', authToken);
    setToken(authToken);
    
    setUser(toPublicUser(next));
    return { ok: true };
  }, []);

  const updatePassword = useCallback<AuthContextValue['updatePassword']>(
    (currentPassword, nextPassword) => {
      const sessionId = readSessionUserId();
      if (!sessionId) return { ok: false, error: 'invalid' };
      const users = readUsers();
      const found = users.find((u) => u.id === sessionId);
      if (!found || found.password !== currentPassword) return { ok: false, error: 'invalid' };
      const updated: StoredUser = { ...found, password: nextPassword };
      writeUsers(users.map((u) => (u.id === found.id ? updated : u)));
      setUser(toPublicUser(updated));
      return { ok: true };
    },
    []
  );

  const upgradeSubscriptionTier = useCallback<AuthContextValue['upgradeSubscriptionTier']>((tier) => {
    const sessionId = readSessionUserId();
    if (!sessionId) return { ok: false, error: 'not_logged_in' };
    const users = readUsers();
    const found = users.find((u) => u.id === sessionId);
    if (!found) return { ok: false, error: 'not_logged_in' };
    const normalized = ensureSubscriptionUpToDate(found);
    const nextPrice = annualPriceEur(normalized.profileType, tier);
    const paid = normalized.subscriptionPaidEur;
    const dueNowEur = Math.max(0, nextPrice - nextPrice * 0.15 - paid);
    const updated: StoredUser = {
      ...normalized,
      subscriptionTier: tier,
      subscriptionPaidEur: Math.round((paid + dueNowEur) * 100) / 100,
      subscriptionPendingTier: undefined,
      subscriptionPendingStartsAt: undefined,
    };
    writeUsers(users.map((u) => (u.id === found.id ? updated : u)));
    setUser(toPublicUser(updated));
    return { ok: true, dueNowEur };
  }, []);

  const scheduleDowngradeTier = useCallback<AuthContextValue['scheduleDowngradeTier']>((tier) => {
    const sessionId = readSessionUserId();
    if (!sessionId) return { ok: false, error: 'not_logged_in' };
    const users = readUsers();
    const found = users.find((u) => u.id === sessionId);
    if (!found) return { ok: false, error: 'not_logged_in' };

    const normalized = ensureSubscriptionUpToDate(found);
    const ownerCars = getOwnerCars().filter((c) => c.ownerId === normalized.id);
    const count = billableCarsCount(normalized.profileType, ownerCars);
    const maxAllowed = maxCarsForTier(tier);
    if (count > maxAllowed) return { ok: false, error: 'too_many_cars' };

    const startsAt = normalized.subscriptionEndsAt;
    const updated: StoredUser = {
      ...normalized,
      subscriptionPendingTier: tier,
      subscriptionPendingStartsAt: startsAt,
    };
    writeUsers(users.map((u) => (u.id === found.id ? updated : u)));
    setUser(toPublicUser(updated));
    return { ok: true, startsAt };
  }, []);

  const cancelScheduledTierChange = useCallback<AuthContextValue['cancelScheduledTierChange']>(() => {
    const sessionId = readSessionUserId();
    if (!sessionId) return { ok: false, error: 'not_logged_in' };
    const users = readUsers();
    const found = users.find((u) => u.id === sessionId);
    if (!found) return { ok: false, error: 'not_logged_in' };
    const updated: StoredUser = { ...found, subscriptionPendingTier: undefined, subscriptionPendingStartsAt: undefined };
    writeUsers(users.map((u) => (u.id === found.id ? updated : u)));
    setUser(toPublicUser(updated));
    return { ok: true };
  }, []);

  const setUserFromApi = useCallback<AuthContextValue['setUserFromApi']>((userFromApi) => {
    const stored: StoredUser = { ...userFromApi, password: '' };
    const users = readUsers();
    const idx = users.findIndex((u) => u.id === stored.id);
    const nextUsers = idx === -1 ? [stored, ...users] : users.map((u, i) => (i === idx ? stored : u));
    writeUsers(nextUsers);
    writeSessionUserId(stored.id);
    setUser(toPublicUser(stored));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      login,
      logout,
      register,
      updatePassword,
      upgradeSubscriptionTier,
      scheduleDowngradeTier,
      cancelScheduledTierChange,
      setUserFromApi,
      refreshToken,
      hasValidToken,
    }),
    [
      user,
      token,
      login,
      logout,
      register,
      updatePassword,
      upgradeSubscriptionTier,
      scheduleDowngradeTier,
      cancelScheduledTierChange,
      setUserFromApi,
      refreshToken,
      hasValidToken,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function calculateSubscriptionPriceEur(profileType: OwnerProfileType, carCountForBilling: number) {
  const tier: SubscriptionTier =
    carCountForBilling <= 3
      ? 'free'
      : carCountForBilling <= 5
        ? 'basic5'
        : carCountForBilling <= 10
          ? 'plus10'
          : carCountForBilling <= 20
            ? 'standard20'
            : 'pro20plus';

  if (tier === 'free') return { tier, priceEur: 0 };
  if (tier === 'basic5') return { tier, priceEur: 180 };
  if (tier === 'plus10') return { tier, priceEur: 250 };
  if (tier === 'standard20') return { tier, priceEur: 350 };
  return { tier, priceEur: 450 };
}
