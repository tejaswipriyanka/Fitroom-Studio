import React, { useState } from 'react';
import { Camera, Image, Mic, Moon, Sun, Trash2, X } from 'lucide-react';
import { FitroomSettings, PermissionStateSetting } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FitroomSettings;
  onUpdateSettings: (settings: FitroomSettings) => void;
  onClearChatHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearChatHistory,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const requestMediaPermission = async (kind: 'camera' | 'mic') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        kind === 'camera' ? { video: true } : { audio: true }
      );
      stream.getTracks().forEach((t) => t.stop());
      onUpdateSettings({
        ...settings,
        [kind === 'camera' ? 'cameraPermission' : 'micPermission']: 'granted' as PermissionStateSetting,
      });
    } catch {
      onUpdateSettings({
        ...settings,
        [kind === 'camera' ? 'cameraPermission' : 'micPermission']: 'denied' as PermissionStateSetting,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#111216] border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 id="settings-modal-title" className="text-base font-bold text-stone-950 dark:text-white">
            Studio Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Studio Theme
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: 'white' })}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  settings.theme === 'white'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/30'
                    : 'border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-900 dark:text-white">
                  <Sun className="w-4 h-4 text-blue-700" />
                  <span>Chalk &amp; Oxford Blue</span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  Daylight neutral surfaces
                </p>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: 'black' })}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  settings.theme === 'black'
                    ? 'border-[#d48b55] bg-[#8c4a1e]/15'
                    : 'border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-900 dark:text-white">
                  <Moon className="w-4 h-4 text-[#d48b55]" />
                  <span>Noir &amp; Saddle Brown</span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  Low-glare studio evening
                </p>
              </button>
            </div>
          </section>

          <section className="space-y-3 border-t border-stone-200 dark:border-zinc-800 pt-5">
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Consultation History
            </h3>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-stone-900 dark:text-white">
                  Save chat sessions
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Keep styling conversations accessible in the sidebar
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.keepChatHistory}
                onClick={() =>
                  onUpdateSettings({ ...settings, keepChatHistory: !settings.keepChatHistory })
                }
                className={`w-11 h-6 rounded-full transition p-0.5 cursor-pointer shrink-0 ${
                  settings.keepChatHistory
                    ? 'bg-blue-700 dark:bg-[#8c4a1e]'
                    : 'bg-stone-300 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.keepChatHistory ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-2">
              {!confirmClear ? (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/60 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Active Chat History</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60">
                  <span className="text-xs text-red-700 dark:text-red-300 flex-1">
                    Remove current messages from view?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClearChatHistory();
                      setConfirmClear(false);
                    }}
                    className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-3 py-1 rounded-lg border border-stone-300 dark:border-zinc-700 text-xs text-stone-700 dark:text-stone-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-3 border-t border-stone-200 dark:border-zinc-800 pt-5">
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Device Permissions
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2 text-stone-800 dark:text-stone-200">
                  <Camera className="w-4 h-4 text-stone-500" />
                  <span>Camera ({settings.cameraPermission})</span>
                </span>
                <button
                  type="button"
                  onClick={() => requestMediaPermission('camera')}
                  className="px-3 py-1 rounded-lg border border-stone-200 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-stone-300 cursor-pointer"
                >
                  Check Access
                </button>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2 text-stone-800 dark:text-stone-200">
                  <Mic className="w-4 h-4 text-stone-500" />
                  <span>Microphone ({settings.micPermission})</span>
                </span>
                <button
                  type="button"
                  onClick={() => requestMediaPermission('mic')}
                  className="px-3 py-1 rounded-lg border border-stone-200 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-stone-300 cursor-pointer"
                >
                  Check Access
                </button>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2 text-stone-800 dark:text-stone-200">
                  <Image className="w-4 h-4 text-stone-500" />
                  <span>Photo Upload ({settings.photosPermission})</span>
                </span>
                <span className="text-stone-500 dark:text-stone-400">Browser file picker</span>
              </div>
            </div>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-stone-200 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-950 dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
