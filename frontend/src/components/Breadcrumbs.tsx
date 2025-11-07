import React from 'react';
import { useNavigation } from '../context/NavigationContext';

export const Breadcrumbs: React.FC = () => {
    const { breadcrumbs } = useNavigation();
    return (
        <nav className="text-sm font-medium text-gray-500">
            {breadcrumbs.join(' / ')}
        </nav>
    );
};
