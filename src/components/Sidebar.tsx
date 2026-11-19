import React, { useState } from 'react';
import { MessageSquarePlus, Trash2, X } from 'lucide-react';
import { EXPERTS } from '../data/experts';
import { ExpertStylist, SavedChatSession } from '../types';

interface SidebarProps {
  activeExpert: ExpertStylist;
  onSelectExpert: (expert: ExpertStylist) => void;
  onNewChat: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  savedSessions: SavedChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeExpert,
  onSelectExpert,
  onNewChat,
  isOpenMobile,
  onCloseMobile,
  savedSessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
}) => {
  const [failedAvatars, setFailedAvatars] = useState<Record<string, boolean>>({});

  const formatSessionTime = (iso: string) => {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-[#0c0c0e] border-r border-stone-200 dark:border-zinc-800 w-72 shrink-0">
      <div className="p-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            onNewChat();
            onCloseMobile();
          }}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-950 dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 transition cursor-pointer whitespace-nowrap"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>New Consultation</span>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close sidebar"
          className="md:hidden p-2 rounded-lg text-stone-500 hover:bg-stone-200 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold text-stone-500 dark:text-stone-400 px-1">
            Studio Stylists
          </h2>
          <div className="space-y-1.5">
            {EXPERTS.map((expert) => {
              const isSelected = activeExpert.id === expert.id;
              return (
                <button
                  key={expert.id}
                  type="button"
                  onClick={() => {
                    onSelectExpert(expert);
                    onCloseMobile();
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-[#16171d] border-blue-600/40 dark:border-[#d48b55]/50 shadow-2xs'
                      : 'border-transparent hover:bg-white/70 dark:hover:bg-zinc-900/70'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-200 dark:bg-zinc-800 shrink-0 flex items-center justify-center">
                    {!failedAvatars[expert.id] ? (
                      <img
                        src={expert.avatar}
                        alt={expert.name}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedAvatars((prev) => ({ ...prev, [expert.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                        {expert.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-stone-900 dark:text-white truncate">
                      {expert.name}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                      {expert.role}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2.5 border-t border-stone-200 dark:border-zinc-800 pt-5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Saved Sessions
            </h2>
            <span className="text-[11px] text-stone-400 tabular-nums">
              {savedSessions.length}
            </span>
          </div>

          {savedSessions.length === 0 ? (
            <p className="text-xs text-stone-500 dark:text-stone-500 px-1 leading-relaxed">
              Your recent outfit consultations will appear here when history is enabled.
            </p>
          ) : (
            <div className="space-y-1.5">
              {savedSessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    className={`group flex items-start justify-between gap-2 p-2.5 rounded-xl border transition ${
                      isActive
                        ? 'bg-white dark:bg-[#16171d] border-stone-300 dark:border-zinc-700'
                        : 'border-transparent hover:bg-white/70 dark:hover:bg-zinc-900/70'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSession(session.id);
                        onCloseMobile();
                      }}
                      className="flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <p className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate">
                        {session.previewTitle}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                        {session.occasion} · {formatSessionTime(session.timestamp)}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      aria-label={`Delete session ${session.previewTitle}`}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-zinc-800 opacity-70 group-hover:opacity-100 transition cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex shrink-0">{sidebarContent}</aside>

      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
