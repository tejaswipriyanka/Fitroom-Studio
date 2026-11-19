import React, { useState, useEffect } from 'react';
import { TopNavbar } from './components/TopNavbar';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsModal } from './components/SettingsModal';
import { GuestProfileModal } from './components/GuestProfileModal';
import { AuditorTab } from './components/AuditorTab';
import { FairnessBenchmarkTab } from './components/FairnessBenchmarkTab';
import { RulebookTab } from './components/RulebookTab';
import { ClosetTab } from './components/ClosetTab';
import { OutfitBuilderTab } from './components/OutfitBuilderTab';
import { EXPERTS, OCCASIONS } from './data/experts';
import {
  FitroomSettings,
  GuestProfile,
  ChatMessage,
  ExpertStylist,
  UserProfile,
  AppSettings,
  SavedChatSession,
  ClosetItem,
  WeatherCondition,
  FormalityLevel,
  AuthUser,
} from './types';
import { WelcomeSplash } from './components/WelcomeSplash';
import { AuthGatewayModal } from './components/AuthGatewayModal';
import {
  saveChatSessionToDb,
  saveChatMessageToDb,
  fetchAllChatSessions,
  fetchSessionMessages,
  deleteChatSessionFromDb,
  saveUserProfileToDb,
  loadUserProfileFromDb,
  fetchClosetItems,
  saveClosetItemToDb,
  deleteClosetItemFromDb,
} from './services/chatStorageService';
import {
  getActiveAuthUser,
  signOutActiveUser,
  saveActiveAuthUser,
} from './services/authService';
import {
  MessageSquare,
  Sliders,
  ArrowLeft,
  Shirt,
  Layers,
} from 'lucide-react';

const DEFAULT_FITROOM_SETTINGS: FitroomSettings = {
  usageLimit: 25,
  usageUsed: 0,
  theme: 'white',
  keepChatHistory: true,
  cameraPermission: 'prompt',
  photosPermission: 'prompt',
  micPermission: 'prompt',
};

const DEFAULT_GUEST: GuestProfile = {
  name: 'Guest User',
  status: 'Guest User',
  avatarInitials: 'GU',
  isGuest: true,
  joinedAt: 'Today',
};

export default function App() {
  const [activeView, setActiveView] = useState<
    'chat' | 'builder' | 'closet' | 'auditor' | 'benchmark' | 'rules'
  >('chat');

  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    return getActiveAuthUser();
  });

  const [flowState, setFlowState] = useState<'splash' | 'auth' | 'app'>(() => {
    const existing = getActiveAuthUser();
    return existing ? 'app' : 'splash';
  });

  const [guestProfile, setGuestProfile] = useState<GuestProfile>(() => {
    const active = getActiveAuthUser();
    if (active) {
      return {
        name: active.name,
        status: active.isGuest ? 'Guest User' : 'Google User',
        avatarInitials: active.avatarInitials,
        isGuest: active.isGuest,
        joinedAt: active.joinedAt,
      };
    }
    return DEFAULT_GUEST;
  });

  const [settings, setSettings] = useState<FitroomSettings>(() => {
    try {
      const saved = localStorage.getItem('fitroom_settings');
      return saved ? JSON.parse(saved) : DEFAULT_FITROOM_SETTINGS;
    } catch {
      return DEFAULT_FITROOM_SETTINGS;
    }
  });

  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [weatherCondition, setWeatherCondition] = useState<WeatherCondition>('sunny_warm');
  const [formalityLevel, setFormalityLevel] = useState<FormalityLevel>('smart_casual');
  const [useClosetOnly, setUseClosetOnly] = useState<boolean>(false);

  const [activeExpert, setActiveExpert] = useState<ExpertStylist>(EXPERTS[0]);
  const [selectedOccasion, setSelectedOccasion] = useState<string>(OCCASIONS[0].label);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [savedSessions, setSavedSessions] = useState<SavedChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      if (!authUser || !settings.keepChatHistory) return [];
      const key = `fitroom_active_msgs_${authUser.uid}`;
      const saved = authUser.isGuest
        ? sessionStorage.getItem(key)
        : localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [isSending, setIsSending] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  useEffect(() => {
    if (!authUser || authUser.isGuest) {
      if (!authUser) {
        setSavedSessions([]);
        setClosetItems([]);
      }
      return;
    }

    loadUserProfileFromDb(authUser.uid)
      .then((remoteProf) => {
        if (remoteProf) {
          setGuestProfile((prev) => ({ ...prev, ...remoteProf }));
        }
      })
      .catch(() => {});

    fetchAllChatSessions(authUser.uid)
      .then((sessions) => {
        setSavedSessions(sessions || []);
      })
      .catch(() => {});

    fetchClosetItems(authUser.uid)
      .then((items) => {
        setClosetItems(items || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (settings.theme === 'black') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('fitroom_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  useEffect(() => {
    if (!authUser) return;
    const key = `fitroom_active_msgs_${authUser.uid}`;
    const storage = authUser.isGuest ? sessionStorage : localStorage;
    try {
      if (settings.keepChatHistory) {
        storage.setItem(key, JSON.stringify(messages));
      } else {
        storage.removeItem(key);
      }
    } catch {
      // ignore
    }
  }, [messages, settings.keepChatHistory, authUser]);

  const handleUpdateSettings = (newSettings: FitroomSettings) => {
    setSettings(newSettings);
  };

  const handleClearChatHistory = () => {
    setMessages([]);
    setActiveSessionId(null);
    if (!authUser) return;
    const key = `fitroom_active_msgs_${authUser.uid}`;
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  };

  const handleAuthSuccess = (user: AuthUser) => {
    setAuthUser(user);
    setGuestProfile({
      name: user.name,
      status: user.isGuest ? 'Guest User' : 'Google User',
      avatarInitials: user.avatarInitials,
      isGuest: user.isGuest,
      joinedAt: user.joinedAt,
      preferencesReviewed: false,
    });
    setActiveView('chat');
    setActiveExpert(EXPERTS[0]);
    setSelectedOccasion(OCCASIONS[0].label);
    setWeatherCondition('sunny_warm');
    setFormalityLevel('smart_casual');
    setMessages([]);
    setActiveSessionId(null);
    setSavedSessions([]);
    setClosetItems([]);
    setUseClosetOnly(false);
    setIsProfileOpen(false);
    setIsSettingsOpen(false);
    setIsSidebarMobileOpen(false);
    setFlowState('app');

    if (user.isGuest) {
      return;
    }

    loadUserProfileFromDb(user.uid)
      .then((remoteProf) => {
        if (remoteProf) {
          setGuestProfile((prev) => ({ ...prev, ...remoteProf }));
        }
      })
      .catch(() => {});

    fetchAllChatSessions(user.uid)
      .then((sessions) => {
        setSavedSessions(sessions || []);
      })
      .catch(() => {});

    fetchClosetItems(user.uid)
      .then((items) => {
        setClosetItems(items || []);
      })
      .catch(() => {});
  };

  const handleSignOut = async () => {
    await signOutActiveUser();
    setAuthUser(null);
    setGuestProfile(DEFAULT_GUEST);
    setActiveExpert(EXPERTS[0]);
    setSelectedOccasion(OCCASIONS[0].label);
    setWeatherCondition('sunny_warm');
    setFormalityLevel('smart_casual');
    setMessages([]);
    setActiveSessionId(null);
    setSavedSessions([]);
    setClosetItems([]);
    setActiveView('chat');
    setUseClosetOnly(false);
    setIsProfileOpen(false);
    setIsSettingsOpen(false);
    setIsSidebarMobileOpen(false);
    setFlowState('auth');
  };

  const handleUpdateProfile = (newProfile: GuestProfile) => {
    setGuestProfile(newProfile);
    if (authUser) {
      const updatedUser: AuthUser = {
        ...authUser,
        name: newProfile.name,
        avatarInitials: newProfile.avatarInitials,
      };
      setAuthUser(updatedUser);
      saveActiveAuthUser(updatedUser);
    }
    saveUserProfileToDb(newProfile, authUser?.uid).catch(() => {});
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveSessionId(null);
    if (!authUser) return;
    const key = `fitroom_active_msgs_${authUser.uid}`;
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  };

  const handleSelectOccasion = (occ: string) => {
    setSelectedOccasion(occ);
    setMessages([]);
    setActiveSessionId(null);
    if (!authUser) return;
    const key = `fitroom_active_msgs_${authUser.uid}`;
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    const session = savedSessions.find((s) => s.id === sessionId);
    if (session) {
      setSelectedOccasion(session.occasion);
      const foundExpert = EXPERTS.find(
        (e) => e.id === session.expertId || e.name === session.expertName
      );
      if (foundExpert) setActiveExpert(foundExpert);
    }
    const loadedMsgs = await fetchSessionMessages(sessionId, authUser?.uid);
    if (loadedMsgs && loadedMsgs.length > 0) {
      setMessages(loadedMsgs);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteChatSessionFromDb(sessionId, authUser?.uid);
    setSavedSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setMessages([]);
    }
  };

  const handleSendMessage = async (
    text: string,
    occasion: string,
    imageBase64?: string,
    audioBase64?: string,
    weather?: WeatherCondition,
    formality?: FormalityLevel,
    closetOnly?: boolean
  ) => {
    const userMsgId = `usr-${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text || (imageBase64 ? 'What should I wear with this outfit?' : 'Styling advice needed'),
      timestamp: nowTime,
      occasion,
      imageUrl: imageBase64,
      hasAudio: !!audioBase64,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsSending(true);

    const currentSessionId = activeSessionId || `SESS-${Date.now()}`;
    if (!activeSessionId) {
      setActiveSessionId(currentSessionId);
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 19000);

    const sanitizedUserProfile = {
      name: guestProfile.name,
      ...(guestProfile.heightCm !== undefined ? { heightCm: guestProfile.heightCm } : {}),
      ...(guestProfile.skinToneMonk !== undefined ? { skinToneMonk: guestProfile.skinToneMonk } : {}),
      ...(guestProfile.undertone ? { undertone: guestProfile.undertone } : {}),
      ...(guestProfile.bodyShape ? { bodyShape: guestProfile.bodyShape } : {}),
      ...(guestProfile.colorPreferences ? { colorPreferences: guestProfile.colorPreferences } : {}),
      ...(guestProfile.clothingPreferences ? { clothingPreferences: guestProfile.clothingPreferences } : {}),
    };

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          message: text,
          occasion,
          expert: activeExpert,
          userProfile: sanitizedUserProfile,
          weather: weather || weatherCondition,
          formality: formality || formalityLevel,
          useClosetOnly: closetOnly !== undefined ? closetOnly : useClosetOnly,
          closetItems,
          imageBase64,
          audioBase64,
          generateVisual: !!imageBase64,
          history: messages.slice(-8).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      const selectedFormality = formality || formalityLevel;
      const formalityLabels: Record<FormalityLevel, string> = {
        casual: 'Casual',
        smart_casual: 'Smart Casual',
        business_casual: 'Business Casual',
        formal_evening: 'Formal',
      };
      const detectAskedFormality = (prompt: string): FormalityLevel | undefined => {
        if (/\bbusiness[\s-]+casual\b/i.test(prompt)) return 'business_casual';
        if (/\bsmart[\s-]+casual\b/i.test(prompt)) return 'smart_casual';
        if (/\b(formal|black[\s-]+tie|tuxedo|evening[\s-]+gown|cocktail[\s-]+attire|gala)\b/i.test(prompt)) {
          return 'formal_evening';
        }
        if (/\b(casual|streetwear|hoodie|sweatpants|loungewear|weekend chill)\b/i.test(prompt)) {
          return 'casual';
        }
        return undefined;
      };
      const fallbackSuggested = detectAskedFormality(text || '');
      const fallbackMismatch =
        fallbackSuggested && fallbackSuggested !== selectedFormality
          ? `**Dress Code Mismatch Notice:** The dress code you asked for (**${formalityLabels[fallbackSuggested]}**) and the currently selected Dress Code option (**${formalityLabels[selectedFormality]}**) are different. I suggest switching to the **${formalityLabels[fallbackSuggested]}** dress code option.\n\n`
          : '';

      const missingOptionalFields: string[] = [];
      if (guestProfile.heightCm === undefined) missingOptionalFields.push('height');
      if (guestProfile.skinToneMonk === undefined && !guestProfile.undertone) missingOptionalFields.push('skin tone');
      if (!guestProfile.bodyShape) missingOptionalFields.push('body shape');
      if (!guestProfile.colorPreferences) missingOptionalFields.push('color preferences');
      if (!guestProfile.clothingPreferences) missingOptionalFields.push('clothing preferences');

      let replyContent = '';
      if (data.success && data.reply) {
        replyContent = data.reply;
      } else {
        replyContent =
          fallbackMismatch +
          `Hello! As ${activeExpert.name}, here is advice for **${occasion}**:\n\n` +
          `• **Recommended Combination:** Pair a clean, well-fitted top with contrasting trousers.\n` +
          `• **Color & Fit Notes:** ${
            guestProfile.undertone
              ? `Using palette tones aligned with your ${guestProfile.undertone} undertone keeps the look cohesive.`
              : `Balanced neutral tones work cleanly as a starting point without assuming your palette.`
          }\n` +
          `• **Footwear:** Clean, comfortable footwear ties the whole outfit together.\n` +
          (missingOptionalFields.length > 0
            ? `\n*If you would like tailored suggestions, feel free to share your ${missingOptionalFields.join(', ')}—completely optional, and totally fine to skip!*`
            : '');
      }

      const isOutOfScope = Boolean(data.isOutOfScope);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        occasion,
        expertName: activeExpert.name,
        expertAvatar: activeExpert.avatar,
        outfitName: isOutOfScope ? undefined : data.outfitName,
        generatedOutfitImageUrl: isOutOfScope ? undefined : data.generatedOutfitImageUrl,
        suggestedFormality: isOutOfScope
          ? undefined
          : data.suggestedFormality ||
            (fallbackSuggested && fallbackSuggested !== selectedFormality ? fallbackSuggested : undefined),
        isOutOfScope,
      };

      setMessages((prev) => [...prev, botMsg]);

      if (settings.keepChatHistory) {
        const previewSnippet = (text || 'Outfit query').slice(0, 40);
        const sessionSummary: SavedChatSession = {
          id: currentSessionId,
          expertId: activeExpert.id,
          expertName: activeExpert.name,
          occasion,
          previewTitle: data.outfitName || `${activeExpert.name}: ${previewSnippet}`,
          lastMessageSnippet: replyContent.slice(0, 100).replace(/[*#]/g, ''),
          timestamp: new Date().toISOString(),
          messageCount: messages.length + 2,
        };

        saveChatSessionToDb(sessionSummary, authUser?.uid)
          .then(() => saveChatMessageToDb(currentSessionId, newUserMsg, authUser?.uid))
          .then(() => saveChatMessageToDb(currentSessionId, botMsg, authUser?.uid))
          .catch(() => {});

        setSavedSessions((prev) => [
          sessionSummary,
          ...prev.filter((s) => s.id !== currentSessionId),
        ]);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('Chat response fallback triggered:', err);

      const selectedFormality = formality || formalityLevel;
      const formalityLabels: Record<FormalityLevel, string> = {
        casual: 'Casual',
        smart_casual: 'Smart Casual',
        business_casual: 'Business Casual',
        formal_evening: 'Formal',
      };
      let asked: FormalityLevel | undefined;
      if (/\bbusiness[\s-]+casual\b/i.test(text || '')) asked = 'business_casual';
      else if (/\bsmart[\s-]+casual\b/i.test(text || '')) asked = 'smart_casual';
      else if (/\b(formal|black[\s-]+tie|tuxedo|evening[\s-]+gown|cocktail[\s-]+attire|gala)\b/i.test(text || '')) asked = 'formal_evening';
      else if (/\b(casual|streetwear|hoodie|sweatpants|loungewear|weekend chill)\b/i.test(text || '')) asked = 'casual';

      const mismatchPrefix =
        asked && asked !== selectedFormality
          ? `**Dress Code Mismatch Notice:** The dress code you asked for (**${formalityLabels[asked]}**) and the currently selected Dress Code option (**${formalityLabels[selectedFormality]}**) are different. I suggest switching to the **${formalityLabels[asked]}** dress code option.\n\n`
          : '';

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: `${mismatchPrefix}Here is a quick style tip for **${occasion}**: Pair simple classic pieces—like dark blue jeans and a clean t-shirt or shirt—and keep your shoes polished to look sharp effortlessly!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        occasion,
        expertName: activeExpert.name,
        expertAvatar: activeExpert.avatar,
        outfitName: 'Everyday Simple Fit',
        suggestedFormality: asked && asked !== selectedFormality ? asked : undefined,
      };

      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateOutfitPhoto = async (messageId: string, customOutfitName?: string) => {
    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg) return;

    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isGeneratingImage: true } : m))
    );

    try {
      const sanitizedUserProfile = {
        name: guestProfile.name,
        ...(guestProfile.heightCm !== undefined ? { heightCm: guestProfile.heightCm } : {}),
        ...(guestProfile.skinToneMonk !== undefined ? { skinToneMonk: guestProfile.skinToneMonk } : {}),
        ...(guestProfile.undertone ? { undertone: guestProfile.undertone } : {}),
        ...(guestProfile.bodyShape ? { bodyShape: guestProfile.bodyShape } : {}),
        ...(guestProfile.colorPreferences ? { colorPreferences: guestProfile.colorPreferences } : {}),
        ...(guestProfile.clothingPreferences ? { clothingPreferences: guestProfile.clothingPreferences } : {}),
      };
      const response = await fetch('/api/generate-outfit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occasion: targetMsg.occasion || selectedOccasion,
          userProfile: sanitizedUserProfile,
          outfitDescription: targetMsg.content,
          outfitName: customOutfitName || targetMsg.outfitName,
        }),
      });

      const data = await response.json();
      if (data.success && data.imageUrl) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  generatedOutfitImageUrl: data.imageUrl,
                  outfitName: data.outfitName || m.outfitName,
                  isGeneratingImage: false,
                }
              : m
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  isGeneratingImage: false,
                  content: data.error
                    ? `${m.content}\n\n*Lookbook render note: ${data.error}*`
                    : m.content,
                }
              : m
          )
        );
      }
    } catch (err) {
      console.error('Failed to generate outfit image:', err);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isGeneratingImage: false } : m))
      );
    }
  };

  const handleAddClosetItem = (item: ClosetItem) => {
    setClosetItems((prev) => [item, ...prev]);
    saveClosetItemToDb(item, authUser?.uid).catch(() => {});
  };

  const handleDeleteClosetItem = (id: string) => {
    setClosetItems((prev) => prev.filter((i) => i.id !== id));
    deleteClosetItemFromDb(id, authUser?.uid).catch(() => {});
  };

  const handleToggleFavoriteItem = (id: string) => {
    setClosetItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const updated = { ...i, isFavorite: !i.isFavorite };
          saveClosetItemToDb(updated, authUser?.uid).catch(() => {});
          return updated;
        }
        return i;
      })
    );
  };

  const handleStyleItemInChat = (item: ClosetItem) => {
    setActiveView('chat');
    const prompt = `How should I style my ${item.name} (${item.colorName}, ${item.fabric || 'cotton'}) for a ${selectedOccasion}? Suggest the best bottom, shoes, and layering to wear with it.`;
    handleSendMessage(prompt, selectedOccasion);
  };

  const handleOpenInOutfitBuilder = (_item: ClosetItem) => {
    setActiveView('builder');
  };

  const handleSendLookToChat = (lookSummary: string) => {
    setActiveView('chat');
    handleSendMessage(lookSummary, selectedOccasion);
  };

  const legacyProfile: UserProfile = {
    name: guestProfile.name,
    preferredOccasion: selectedOccasion,
    heightCm: guestProfile.heightCm,
    defaultUndertone: guestProfile.undertone,
    defaultMonkSkinTone: guestProfile.skinToneMonk,
    bodyShape: guestProfile.bodyShape,
    colorPreferences: guestProfile.colorPreferences,
    clothingPreferences: guestProfile.clothingPreferences,
    avatarInitials: guestProfile.avatarInitials,
    joinedDate: guestProfile.joinedAt,
  };

  const legacySettings: AppSettings = {
    storeHistory: settings.keepChatHistory,
    theme: settings.theme === 'black' ? 'dark' : 'light',
    lightingSensitivity: 'standard',
    developerMode: false,
  };

  if (flowState === 'splash') {
    return (
      <WelcomeSplash
        onContinue={() => setFlowState('auth')}
        settings={settings}
        onToggleTheme={() => {
          setSettings((prev) => ({
            ...prev,
            theme: prev.theme === 'black' ? 'white' : 'black',
          }));
        }}
      />
    );
  }

  if (flowState === 'auth') {
    return (
      <AuthGatewayModal
        onSuccess={handleAuthSuccess}
        onBackToWelcome={() => setFlowState('splash')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200">
      <TopNavbar
        authUser={authUser}
        guestProfile={guestProfile}
        settings={settings}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSignOut={handleSignOut}
        isSidebarOpenMobile={isSidebarMobileOpen}
        onToggleSidebarMobile={() => setIsSidebarMobileOpen((prev) => !prev)}
      />

      <div className="bg-white/95 dark:bg-[#0c0c0e]/95 border-b border-stone-200 dark:border-zinc-800 px-4 sm:px-6 py-2 flex items-center justify-between text-xs overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveView('chat')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeView === 'chat'
                ? 'bg-black text-white ring-1 ring-blue-600/30 dark:bg-white dark:text-black dark:ring-[#8c4a1e]/40 font-semibold shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Fit Stylist Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('builder')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeView === 'builder'
                ? 'bg-black text-white ring-1 ring-blue-600/30 dark:bg-white dark:text-black dark:ring-[#8c4a1e]/40 font-semibold shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-[#d48b55]" />
            <span>Mix &amp; Match Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('closet')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeView === 'closet'
                ? 'bg-black text-white ring-1 ring-blue-600/30 dark:bg-white dark:text-black dark:ring-[#8c4a1e]/40 font-semibold shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Shirt className="w-3.5 h-3.5 text-stone-700 dark:text-zinc-300" />
            <span>My Digital Closet ({closetItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('auditor')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeView === 'auditor'
                ? 'bg-black text-white ring-1 ring-blue-600/30 dark:bg-white dark:text-black dark:ring-[#8c4a1e]/40 font-semibold shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Wardrobe Option Auditor</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-[11px] font-mono text-stone-500 dark:text-stone-400 shrink-0">
          <span>
            Theme:{' '}
            <strong className="text-blue-700 dark:text-[#d48b55] font-bold">
              {settings.theme === 'black' ? 'Noir & Saddle Brown' : 'Chalk & Oxford Blue'}
            </strong>
          </span>
          <span>&middot;</span>
          <span>
            History:{' '}
            <strong className={settings.keepChatHistory ? 'text-blue-700 dark:text-[#d48b55] font-bold' : 'text-stone-400'}>
              {settings.keepChatHistory ? 'Active' : 'Off'}
            </strong>
          </span>
        </div>
      </div>

      {activeView === 'chat' ? (
        <div className="flex-1 flex overflow-hidden">
          <Sidebar
            activeExpert={activeExpert}
            onSelectExpert={(exp) => setActiveExpert(exp)}
            onNewChat={handleNewChat}
            isOpenMobile={isSidebarMobileOpen}
            onCloseMobile={() => setIsSidebarMobileOpen(false)}
            savedSessions={savedSessions}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
          />

          <ChatArea
            activeExpert={activeExpert}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            messages={messages}
            onSendMessage={handleSendMessage}
            isSending={isSending}
            selectedOccasion={selectedOccasion}
            onSelectOccasion={handleSelectOccasion}
            closetItems={closetItems}
            guestProfile={guestProfile}
            weatherCondition={weatherCondition}
            onSelectWeather={setWeatherCondition}
            formalityLevel={formalityLevel}
            onSelectFormality={setFormalityLevel}
            useClosetOnly={useClosetOnly}
            onToggleUseClosetOnly={setUseClosetOnly}
            onGenerateOutfitPhoto={handleGenerateOutfitPhoto}
            onOpenProfile={() => setIsProfileOpen(true)}
            onSkipProfilePrompt={() =>
              handleUpdateProfile({ ...guestProfile, preferencesReviewed: true })
            }
          />
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setActiveView('chat')}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#14151b] border border-stone-200 dark:border-zinc-800 text-stone-800 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800 transition text-xs font-semibold shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-blue-700 dark:text-[#d48b55]" />
              <span>Back to Stylist Chat</span>
            </button>
          </div>

          {activeView === 'builder' && (
            <OutfitBuilderTab
              closetItems={closetItems}
              guestProfile={guestProfile}
              activeExpert={activeExpert}
              selectedOccasion={selectedOccasion}
              onSendLookToChat={handleSendLookToChat}
            />
          )}

          {activeView === 'closet' && (
            <ClosetTab
              closetItems={closetItems}
              onAddItem={handleAddClosetItem}
              onDeleteItem={handleDeleteClosetItem}
              onToggleFavorite={handleToggleFavoriteItem}
              onStyleItemInChat={handleStyleItemInChat}
              onOpenInOutfitBuilder={handleOpenInOutfitBuilder}
              guestProfile={guestProfile}
            />
          )}

          {activeView === 'auditor' && (
            <AuditorTab
              profile={legacyProfile}
              settings={legacySettings}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenProfile={() => setIsProfileOpen(true)}
            />
          )}
          {activeView === 'benchmark' && <FairnessBenchmarkTab />}
          {activeView === 'rules' && <RulebookTab />}
        </main>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onClearChatHistory={handleClearChatHistory}
      />

      <GuestProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={guestProfile}
        accountId={authUser?.uid}
        onUpdateProfile={handleUpdateProfile}
      />
    </div>
  );
}
