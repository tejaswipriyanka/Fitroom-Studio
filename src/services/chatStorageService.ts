import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ChatMessage, ClosetItem, GuestProfile, SavedChatSession } from '../types';
import { waitForFirebaseAuthUid } from './authService';

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  return cleaned || `id_${Date.now()}`;
}

function getStorageForUid(uid?: string): Storage {
  if (!uid || uid.startsWith('guest-')) return sessionStorage;
  return localStorage;
}

function readLocalJson<T>(key: string, uid?: string, fallback?: T): T {
  try {
    const raw = getStorageForUid(uid).getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return fallback as T;
}

function writeLocalJson(key: string, value: unknown, uid?: string): void {
  try {
    getStorageForUid(uid).setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

function sanitizeHex(hex?: string): string {
  if (hex && /^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  return '#2A4B7C';
}

function stripPersonalAndUnsetFields(profile: Partial<GuestProfile>): Partial<GuestProfile> {
  const clean: Partial<GuestProfile> = {
    name: profile.name,
    status: profile.status,
    avatarInitials: profile.avatarInitials,
    isGuest: profile.isGuest,
    joinedAt: profile.joinedAt,
    preferencesReviewed: Boolean(profile.preferencesReviewed),
  };
  if (typeof profile.heightCm === 'number' && profile.heightCm >= 100 && profile.heightCm <= 240) {
    clean.heightCm = Math.round(profile.heightCm);
  }
  if (typeof profile.skinToneMonk === 'number' && profile.skinToneMonk >= 1 && profile.skinToneMonk <= 10) {
    clean.skinToneMonk = Math.round(profile.skinToneMonk);
  }
  if (profile.undertone && ['warm', 'cool', 'neutral', 'olive'].includes(profile.undertone)) {
    clean.undertone = profile.undertone;
  }
  if (typeof profile.bodyShape === 'string' && profile.bodyShape.trim()) {
    clean.bodyShape = profile.bodyShape.trim().slice(0, 60);
  }
  if (typeof profile.colorPreferences === 'string' && profile.colorPreferences.trim()) {
    clean.colorPreferences = profile.colorPreferences.trim().slice(0, 160);
  }
  if (typeof profile.clothingPreferences === 'string' && profile.clothingPreferences.trim()) {
    clean.clothingPreferences = profile.clothingPreferences.trim().slice(0, 160);
  }
  return clean;
}

export async function saveUserProfileToDb(profile: GuestProfile, uid?: string): Promise<void> {
  if (!uid) return;
  const sanitizedLocal = stripPersonalAndUnsetFields(profile);
  writeLocalJson(`fitroom_profile_${uid}`, sanitizedLocal, uid);

  const authUid = await waitForFirebaseAuthUid(uid);
  if (!authUid) return;

  const path = `users/${authUid}/profile/main`;
  const ref = doc(db, 'users', authUid, 'profile', 'main');
  try {
    const existing = await getDoc(ref);
    const baseRequired = {
      name: (profile.name || 'Studio Member').slice(0, 80),
      avatarInitials: (profile.avatarInitials || 'SM').slice(0, 4),
      status: (profile.status || 'Google User').slice(0, 40),
      joinedAt: (profile.joinedAt || 'Today').slice(0, 40),
      preferencesReviewed: Boolean(profile.preferencesReviewed),
      updatedAt: serverTimestamp(),
    };

    if (!existing.exists()) {
      const createPayload: Record<string, unknown> = {
        ...baseRequired,
        isGuest: Boolean(profile.isGuest),
        ownerId: authUid,
        createdAt: serverTimestamp(),
      };
      if (sanitizedLocal.heightCm !== undefined) createPayload.heightCm = sanitizedLocal.heightCm;
      if (sanitizedLocal.skinToneMonk !== undefined) createPayload.skinToneMonk = sanitizedLocal.skinToneMonk;
      if (sanitizedLocal.undertone !== undefined) createPayload.undertone = sanitizedLocal.undertone;
      if (sanitizedLocal.bodyShape !== undefined) createPayload.bodyShape = sanitizedLocal.bodyShape;
      if (sanitizedLocal.colorPreferences !== undefined) createPayload.colorPreferences = sanitizedLocal.colorPreferences;
      if (sanitizedLocal.clothingPreferences !== undefined) createPayload.clothingPreferences = sanitizedLocal.clothingPreferences;
      await setDoc(ref, createPayload);
    } else {
      const updatePayload: Record<string, unknown> = {
        ...baseRequired,
        email: deleteField(),
        age: deleteField(),
        genderPreference: deleteField(),
        stylePreference: deleteField(),
        heightCm: sanitizedLocal.heightCm !== undefined ? sanitizedLocal.heightCm : deleteField(),
        skinToneMonk: sanitizedLocal.skinToneMonk !== undefined ? sanitizedLocal.skinToneMonk : deleteField(),
        undertone: sanitizedLocal.undertone !== undefined ? sanitizedLocal.undertone : deleteField(),
        bodyShape: sanitizedLocal.bodyShape !== undefined ? sanitizedLocal.bodyShape : deleteField(),
        colorPreferences: sanitizedLocal.colorPreferences !== undefined ? sanitizedLocal.colorPreferences : deleteField(),
        clothingPreferences: sanitizedLocal.clothingPreferences !== undefined ? sanitizedLocal.clothingPreferences : deleteField(),
      };
      await updateDoc(ref, updatePayload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadUserProfileFromDb(uid?: string): Promise<Partial<GuestProfile> | null> {
  if (!uid) return null;
  const cachedRaw = readLocalJson<Partial<GuestProfile> | null>(`fitroom_profile_${uid}`, uid, null);
  const cached = cachedRaw ? stripPersonalAndUnsetFields(cachedRaw) : null;

  const authUid = await waitForFirebaseAuthUid(uid);
  if (!authUid) return cached;

  const path = `users/${authUid}/profile/main`;
  try {
    const snap = await getDoc(doc(db, 'users', authUid, 'profile', 'main'));
    if (snap.exists()) {
      const data = stripPersonalAndUnsetFields(snap.data() as Partial<GuestProfile>);
      writeLocalJson(`fitroom_profile_${uid}`, data, uid);
      return data;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
  return cached;
}

export async function fetchClosetItems(uid?: string): Promise<ClosetItem[]> {
  if (!uid) return [];
  const localItems = readLocalJson<ClosetItem[]>(`fitroom_closet_${uid}`, uid, []);

  const authUid = await waitForFirebaseAuthUid(uid);
  if (!authUid) return localItems;

  const path = `users/${authUid}/closetItems`;
  try {
    const q = query(
      collection(db, 'users', authUid, 'closetItems'),
      where('ownerId', '==', authUid)
    );
    const snap = await getDocs(q);
    const localImageMap = new Map(localItems.map((item) => [item.id, item.imageUrl]));
    const remoteItems: ClosetItem[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: data.id || d.id,
        name: data.name || 'Untitled Garment',
        category: data.category || 'tops',
        colorName: data.colorName || 'Neutral',
        colorHex: sanitizeHex(data.colorHex),
        fabric: data.fabric || undefined,
        season: data.season || undefined,
        formality: data.formality || 'smart_casual',
        notes: data.notes || undefined,
        isFavorite: Boolean(data.isFavorite),
        createdAt: data.createdAtIso || new Date().toISOString(),
        imageUrl: localImageMap.get(d.id),
      };
    });
    remoteItems.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    writeLocalJson(`fitroom_closet_${uid}`, remoteItems, uid);
    return remoteItems;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveClosetItemToDb(item: ClosetItem, uid?: string): Promise<void> {
  if (!uid) return;
  const safeId = sanitizeId(item.id);
  const existingLocal = readLocalJson<ClosetItem[]>(`fitroom_closet_${uid}`, uid, []);
  const nextLocal = [{ ...item, id: safeId }, ...existingLocal.filter((i) => i.id !== safeId && i.id !== item.id)];
  writeLocalJson(`fitroom_closet_${uid}`, nextLocal, uid);

  const authUid = await waitForFirebaseAuthUid(uid);
  if (!authUid) return;

  const path = `users/${authUid}/closetItems/${safeId}`;
  const ref = doc(db, 'users', authUid, 'closetItems', safeId);
  try {
    const snap = await getDoc(ref);
    const baseFields = {
      name: (item.name || 'Garment').slice(0, 120),
      category: item.category,
      colorName: (item.colorName || 'Neutral').slice(0, 60),
      colorHex: sanitizeHex(item.colorHex),
      formality: item.formality,
      isFavorite: Boolean(item.isFavorite),
      ...(item.fabric ? { fabric: item.fabric.slice(0, 60) } : {}),
      ...(item.season ? { season: item.season.slice(0, 40) } : {}),
      ...(item.notes ? { notes: item.notes.slice(0, 400) } : {}),
      updatedAt: serverTimestamp(),
    };

    if (!snap.exists()) {
      await setDoc(ref, {
        ...baseFields,
        ownerId: authUid,
        id: safeId,
        createdAtIso: (item.createdAt || new Date().toISOString()).slice(0, 40),
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, baseFields);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteClosetItemFromDb(itemId: string, uid?: string): Promise<void> {
  if (!uid) return;
  const safeId = sanitizeId(itemId);
  const existingLocal = readLocalJson<ClosetItem[]>(`fitroom_closet_${uid}`, uid, []);
  writeLocalJson(
    `fitroom_closet_${uid}`,
    existingLocal.filter((i) => i.id !== itemId && i.id !== safeId),
    uid
  );

  const authUid = await waitForFirebaseAuthUid(uid);
  if (!authUid) return;

  const path = `users/${authUid}/closetItems/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', authUid, 'closetItems', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchAllChatSessions(uid?: string): Promise<SavedChatSession[]> {
  if (!uid) return [];
  const localSessions = readLocalJson<SavedChatSession[]>(`fitroom_sessions_${uid}`, uid, []);

  const authUid = await waitForFirebaseAuthUid(uid);
  if (!authUid) return localSessions;

  const path = `users/${authUid}/chatSessions`;
  try {
    const q = query(
      collection(db, 'users', authUid, 'chatSessions'),
      where('ownerId', '==', authUid),
      orderBy('timestamp', 'desc')
    );
    const snap = await getDocs(q);
    const remote: SavedChatSession[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: data.id || d.id,
        expertId: data.expertId || 'aria-chen',
        expertName: data.expertName || 'Aria Chen',
        occasion: data.occasion || 'Everyday & Campus',
        previewTitle: data.previewTitle || 'Styling Session',
        lastMessageSnippet: data.lastMessageSnippet || '',
        timestamp: data.timestamp || new Date().toISOString(),
        messageCount: typeof data.messageCount === 'number' ? data.messageCount : 0,
      };
    });
    writeLocalJson(`fitroom_sessions_${uid}`, remote, uid);
    return remote;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveChatSessionToDb(session: SavedChatSession, uid?: string): Promise<void> {
  if (!uid) return;
  const safeId = sanitizeId(session.id);
  const existingLocal = readLocalJson<SavedChatSession[]>(`fitroom_sessions_${uid}`, uid, []);
  const nextLocal = [{ ...session, id: safeId }, ...existingLocal.filter((s) => s.id !== session.id && s.id !== safeId)];
  writeLocalJson(`fitroom_sessions_${uid}`, nextLocal, uid);

  const authUid = await waitForFirebaseAuthUid(uid);
  if (!authUid) return;

  const path = `users/${authUid}/chatSessions/${safeId}`;
  const ref = doc(db, 'users', authUid, 'chatSessions', safeId);
  try {
    const snap = await getDoc(ref);
    const fields = {
      expertId: (session.expertId || 'aria-chen').slice(0, 64),
      expertName: (session.expertName || 'Aria Chen').slice(0, 80),
      occasion: (session.occasion || 'Everyday & Campus').slice(0, 80),
      previewTitle: (session.previewTitle || 'Styling Session').slice(0, 160),
      lastMessageSnippet: (session.lastMessageSnippet || '').slice(0, 240),
      timestamp: (session.timestamp || new Date().toISOString()).slice(0, 40),
      messageCount: Math.min(5000, Math.max(0, Math.round(session.messageCount || 0))),
      updatedAt: serverTimestamp(),
    };

    if (!snap.exists()) {
      await setDoc(ref, {
        ...fields,
        ownerId: authUid,
        id: safeId,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, fields);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveChatMessageToDb(
  sessionId: string,
  message: ChatMessage,
  uid?: string
): Promise<void> {
  if (!uid) return;
  const safeSessionId = sanitizeId(sessionId);
  const safeMsgId = sanitizeId(message.id);

  const localKey = `fitroom_msgs_${uid}_${safeSessionId}`;
  const existingMsgs = readLocalJson<ChatMessage[]>(localKey, uid, []);
  const nextMsgs = [...existingMsgs.filter((m) => m.id !== message.id && m.id !== safeMsgId), { ...message, id: safeMsgId }];
  writeLocalJson(localKey, nextMsgs, uid);

  const authUid = await waitForFirebaseAuthUid(uid);
  if (!authUid) return;

  const path = `users/${authUid}/chatSessions/${safeSessionId}/messages/${safeMsgId}`;
  const ref = doc(db, 'users', authUid, 'chatSessions', safeSessionId, 'messages', safeMsgId);
  try {
    const snap = await getDoc(ref);
    const base = {
      content: (message.content || ' ').slice(0, 12000),
      ...(message.outfitName ? { outfitName: message.outfitName.slice(0, 120) } : {}),
      updatedAt: serverTimestamp(),
    };

    if (!snap.exists()) {
      await setDoc(ref, {
        ...base,
        ownerId: authUid,
        id: safeMsgId,
        role: message.role,
        timestamp: (message.timestamp || 'Just now').slice(0, 40),
        ...(message.occasion ? { occasion: message.occasion.slice(0, 80) } : {}),
        ...(message.expertName ? { expertName: message.expertName.slice(0, 80) } : {}),
        ...(message.expertAvatar ? { expertAvatar: message.expertAvatar.slice(0, 300) } : {}),
        ...(typeof message.hasAudio === 'boolean' ? { hasAudio: message.hasAudio } : {}),
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, base);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchSessionMessages(sessionId: string, uid?: string): Promise<ChatMessage[]> {
  if (!uid) return [];
  const safeSessionId = sanitizeId(sessionId);
  const localKey = `fitroom_msgs_${uid}_${safeSessionId}`;
  const localMsgs = readLocalJson<ChatMessage[]>(localKey, uid, []);

  const authUid = await waitForFirebaseAuthUid(uid);
  if (!authUid) return localMsgs;

  const path = `users/${authUid}/chatSessions/${safeSessionId}/messages`;
  try {
    const q = query(
      collection(db, 'users', authUid, 'chatSessions', safeSessionId, 'messages'),
      where('ownerId', '==', authUid),
      orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(q);
    const localMediaMap = new Map(
      localMsgs.map((m) => [m.id, { imageUrl: m.imageUrl, generatedOutfitImageUrl: m.generatedOutfitImageUrl }])
    );
    const remote: ChatMessage[] = snap.docs.map((d) => {
      const data = d.data();
      const media = localMediaMap.get(d.id);
      return {
        id: data.id || d.id,
        role: data.role || 'assistant',
        content: data.content || '',
        timestamp: data.timestamp || '',
        occasion: data.occasion,
        expertName: data.expertName,
        expertAvatar: data.expertAvatar,
        outfitName: data.outfitName,
        hasAudio: data.hasAudio,
        imageUrl: media?.imageUrl,
        generatedOutfitImageUrl: media?.generatedOutfitImageUrl,
      };
    });
    if (remote.length > 0) {
      writeLocalJson(localKey, remote, uid);
      return remote;
    }
    return localMsgs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteChatSessionFromDb(sessionId: string, uid?: string): Promise<void> {
  if (!uid) return;
  const safeSessionId = sanitizeId(sessionId);
  const existingLocal = readLocalJson<SavedChatSession[]>(`fitroom_sessions_${uid}`, uid, []);
  writeLocalJson(
    `fitroom_sessions_${uid}`,
    existingLocal.filter((s) => s.id !== sessionId && s.id !== safeSessionId),
    uid
  );
  try {
    getStorageForUid(uid).removeItem(`fitroom_msgs_${uid}_${safeSessionId}`);
  } catch {
    // ignore
  }

  const authUid = await waitForFirebaseAuthUid(uid);
  if (!authUid) return;

  const path = `users/${authUid}/chatSessions/${safeSessionId}`;
  try {
    await deleteDoc(doc(db, 'users', authUid, 'chatSessions', safeSessionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
