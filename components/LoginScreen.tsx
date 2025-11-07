import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleIcon, ScrumOwlLogo } from './icons';
import { useLocale } from '../context/LocaleContext';

const LoginScreen: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const { t } = useLocale();
  const [rememberMe, setRememberMe] = useState(true);

  const handleGoogleSignIn = () => {
    signInWithGoogle(rememberMe);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F0F4F4]">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white/70 rounded-2xl shadow-lg backdrop-blur-sm text-center">
        <div className="flex items-center justify-center gap-2">
          <ScrumOwlLogo className="text-3xl" />
        </div>
        <div>
          <p className="mt-2 text-sm text-[#889C9B]">{t('login_subtitle')}</p>
        </div>
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full inline-flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#486966]"
          >
            <GoogleIcon className="w-5 h-5" />
            {t('login_google_button')}
          </button>
        </div>
        <div className="flex items-center justify-center">
            <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ms-2 block text-sm text-gray-900">
                {t('login_remember_me')}
            </label>
        </div>
        <div className="text-xs text-gray-400">
           <p><span className="font-semibold">{t('login_gmail_only')}</span></p>
           <p className="mt-2">
            {t('login_terms_prefix')}
            <a href="/legal" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">{t('login_terms_of_service')}</a>
            {t('login_terms_and')}
            <a href="/legal" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">{t('login_privacy_policy')}</a>
            {t('login_terms_suffix')}
           </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;