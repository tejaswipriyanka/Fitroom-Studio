import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, User, AlertCircle } from 'lucide-react';
import { AuthUser } from '../types';
import { signInAsGuestUser, signInWithGoogleAccount } from '../services/authService';

interface AuthGatewayModalProps {
  onSuccess: (user: AuthUser) => void;
  onBackToWelcome: () => void;
}

export const AuthGatewayModal: React.FC<AuthGatewayModalProps> = ({
  onSuccess,
  onBackToWelcome,
}) => {
  const [guestName, setGuestName] = useState('');
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsLoadingGoogle(true);
    try {
      const user = await signInWithGoogleAccount();
      onSuccess(user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in could not be completed.';
      setErrorMessage(
        msg.includes('popup-closed-by-user')
          ? 'Sign-in window was closed before completing. You can retry or continue as a guest.'
          : msg.includes('popup-blocked')
          ? 'Browser blocked the sign-in popup. Please allow popups or continue as a guest.'
          : msg
      );
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleGuestContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const guestUser = signInAsGuestUser(guestName);
    onSuccess(guestUser);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-black text-stone-900 dark:text-stone-100 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white dark:bg-[#111216] border border-stone-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToWelcome}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Fitroom Studio
          </span>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-stone-950 dark:text-white">
            Choose how to enter
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Sign in with Google to sync your digital closet and styling chats, or explore as a guest. Only your login mail ID username is used—no personal data is stored.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoadingGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-stone-950 dark:bg-white text-white dark:text-black text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
              />
            </svg>
            <span>{isLoadingGoogle ? 'Signing in...' : 'Continue with Google'}</span>
          </button>
          <p className="text-[11px] text-center text-stone-500 dark:text-stone-400">
            Uses only your mail ID name and any optional styling preferences you choose to share.
          </p>
        </div>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-stone-200 dark:border-zinc-800" />
          <span className="shrink-0 mx-3 text-xs text-stone-400">or</span>
          <div className="flex-grow border-t border-stone-200 dark:border-zinc-800" />
        </div>

        <form onSubmit={handleGuestContinue} className="space-y-3">
          <div>
            <label
              htmlFor="guest-name-input"
              className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5"
            >
              Guest handle or mail ID (optional)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="guest-name-input"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Guest User"
                maxLength={60}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-[#d48b55]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-700 text-stone-800 dark:text-stone-200 text-sm font-semibold hover:bg-stone-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <span>Continue as Guest</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[11px] text-center text-stone-500 dark:text-stone-400">
            Guest sessions stay in your current browser tab only.
          </p>
        </form>
      </div>
    </div>
  );
};
