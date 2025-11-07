import React from 'react';
import { useLocale } from '../context/LocaleContext';

const PendingApprovalScreen: React.FC = () => {
    const { t } = useLocale();
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#F0F4F4]">
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-[#3B3936]">{t('onboarding_pending_title')}</h1>
                <p className="text-gray-600 mt-2">{t('onboarding_pending_body1')}</p>
                <p className="text-gray-600">{t('onboarding_pending_body2')}</p>
            </div>
        </div>
    );
};

export default PendingApprovalScreen;