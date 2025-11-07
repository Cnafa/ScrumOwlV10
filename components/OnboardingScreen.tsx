import React from 'react';
import { ScrumOwlLogo } from './icons';
import { useLocale } from '../context/LocaleContext';

interface OnboardingScreenProps {
    onShowCreate: () => void;
    onShowJoin: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onShowCreate, onShowJoin }) => {
    const { t } = useLocale();
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#F0F4F4]">
            <div className="text-center p-8 bg-white/70 rounded-2xl shadow-lg backdrop-blur-sm max-w-md">
                <ScrumOwlLogo className="text-5xl" />
                <p className="text-gray-700 mt-4 text-2xl">{t('onboarding_setup')}</p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={onShowCreate} className="py-2.5 px-6 bg-[#486966] text-white rounded-md hover:bg-[#3a5a58] font-semibold">
                        {t('onboarding_create_board')}
                    </button>
                    <button onClick={onShowJoin} className="py-2.5 px-6 bg-white border border-[#486966] text-[#486966] rounded-md hover:bg-primarySoft font-semibold">
                        {t('onboarding_join_board')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingScreen;