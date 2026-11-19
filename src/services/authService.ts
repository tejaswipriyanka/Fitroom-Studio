import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { AuthUser } from '../types';

const AUTH_STORAGE_KEY = 'fitroom_auth_user_v1';

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'GU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function extractNameFromEmail(email?: string | null): string {
  const localPart = (email || '').split('@')[0]?.trim() || '';
  return localPart.slice(0, 80) || 'Studio Member';
}

function purgeAllGuestStorage(): void {
  const stores: Storage[] = [sessionStorage, localStorage];
  for (const store of stores) {
    try {
      store.removeItem('fitroom_guest_profile_v2');
      const authRaw = store.getItem(AUTH_STORAGE_KEY);
      if (authRaw) {
        try {
          const parsed = JSON.parse(authRaw) as Partial<AuthUser>;
          if (parsed.isGuest || (typeof parsed.uid === 'string' && parsed.uid.startsWith('guest-'))) {
            store.removeItem(AUTH_STORAGE_KEY);
          }
        } catch {
          store.removeItem(AUTH_STORAGE_KEY);
        }
      }
      for (let i = store.length - 1; i >= 0; i--) {
        const k = store.key(i);
        if (
          k &&
          (k.startsWith('fitroom_profile_guest-') ||
            k.startsWith('fitroom_closet_guest-') ||
            k.startsWith('fitroom_sessions_guest-') ||
            k.startsWith('fitroom_msgs_guest-') ||
            k.startsWith('fitroom_active_msgs_guest-'))
        ) {
          store.removeItem(k);
        }
      }
    } catch {
      // ignore storage cleanup errors
    }
  }
}

export function getActiveAuthUser(): AuthUser | null {
  try {
    const sessionRaw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw) as AuthUser & { email?: string };
      return {
        uid: parsed.uid,
        name: parsed.email ? extractNameFromEmail(parsed.email) : parsed.name || 'Guest User',
        avatarInitials: parsed.avatarInitials || buildInitials(parsed.name || 'Guest User'),
        isGuest: Boolean(parsed.isGuest),
        joinedAt: parsed.joinedAt || 'Today',
      };
    }
    const localRaw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (localRaw) {
      const parsed = JSON.parse(localRaw) as AuthUser & { email?: string };
      if (parsed.isGuest) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }
      return {
        uid: parsed.uid,
        name: parsed.email ? extractNameFromEmail(parsed.email) : parsed.name || 'Studio Member',
        avatarInitials: parsed.avatarInitials || buildInitials(parsed.name || 'Studio Member'),
        isGuest: false,
        joinedAt: parsed.joinedAt || 'Today',
      };
    }
  } catch {
    // ignore storage read errors
  }
  return null;
}

export function saveActiveAuthUser(user: AuthUser): void {
  try {
    const sanitized: AuthUser = {
      uid: user.uid,
      name: user.name,
      avatarInitials: user.avatarInitials,
      isGuest: user.isGuest,
      joinedAt: user.joinedAt,
    };
    const serialized = JSON.stringify(sanitized);
    if (user.isGuest) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, serialized);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      localStorage.setItem(AUTH_STORAGE_KEY, serialized);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // ignore storage write errors
  }
}

export async function signInWithGoogleAccount(): Promise<AuthUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;
  const emailName = extractNameFromEmail(fbUser.email);
  const authUser: AuthUser = {
    uid: fbUser.uid,
    name: emailName,
    avatarInitials: buildInitials(emailName),
    isGuest: false,
    joinedAt: new Date().toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
  };
  saveActiveAuthUser(authUser);
  return authUser;
}

export function signInAsGuestUser(emailOrHandle?: string): AuthUser {
  purgeAllGuestStorage();

  const raw = (emailOrHandle || '').trim();
  const cleanName = raw
    ? (raw.includes('@') ? extractNameFromEmail(raw) : raw.slice(0, 80))
    : 'Guest User';
  const guestId = `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const authUser: AuthUser = {
    uid: guestId,
    name: cleanName,
    avatarInitials: buildInitials(cleanName),
    isGuest: true,
    joinedAt: 'Today',
  };
  try {
    sessionStorage.setItem(`fitroom_closet_${guestId}`, JSON.stringify([]));
    sessionStorage.setItem(`fitroom_sessions_${guestId}`, JSON.stringify([]));
  } catch {
    // ignore
  }
  saveActiveAuthUser(authUser);
  return authUser;
}

export async function signOutActiveUser(): Promise<void> {
  purgeAllGuestStorage();
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith('fitroom_')) {
        sessionStorage.removeItem(k);
      }
    }
  } catch {
    // ignore
  }
  try {
    if (auth.currentUser) {
      await signOut(auth);
    }
  } catch {
    // ignore signOut failure
  }
}

export function waitForFirebaseAuthUid(expectedUid?: string): Promise<string | null> {
  if (!expectedUid || expectedUid.startsWith('guest-')) {
    return Promise.resolve(null);
  }
  if (auth.currentUser && auth.currentUser.uid === expectedUid) {
    return Promise.resolve(auth.currentUser.uid);
  }
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        unsubscribe();
        resolve(auth.currentUser?.uid === expectedUid ? auth.currentUser.uid : null);
      }
    }, 2500);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (settled) return;
      if (user && user.uid === expectedUid) {
        settled = true;
        clearTimeout(timer);
        unsubscribe();
        resolve(user.uid);
      }
    });
  });
}
