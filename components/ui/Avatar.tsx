import React, { useState } from 'react';

/**
 * Extracts initials from a Vietnamese name (first letter of the last two words).
 * E.g., "Nguyễn Quang Linh" -> "QL"
 */
export function getInitials(name: string): string {
    if (!name) return '';
    const cleanName = name.trim();
    if (!cleanName) return '';
    const parts = cleanName.split(/\s+/);
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    const last = parts[parts.length - 1];
    const secondLast = parts[parts.length - 2];
    if (secondLast && last) {
        return `${secondLast.charAt(0)}${last.charAt(0)}`.toUpperCase();
    }
    return last.charAt(0).toUpperCase();
}

interface AvatarProps {
    name: string;
    imageUrl?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
    className?: string;
    ringColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
    name,
    imageUrl,
    size = 'md',
    className = '',
    ringColor = '',
}) => {
    const [imgFailed, setImgFailed] = useState(false);
    const initials = getInitials(name);

    // Map sizes to Tailwind dimension classes
    const sizeClasses = {
        xs: 'w-6 h-6 text-[9px] font-bold',
        sm: 'w-8 h-8 text-[11px] font-semibold',
        md: 'w-10 h-10 text-sm font-semibold',
        lg: 'w-16 h-16 text-lg font-bold',
        xl: 'w-20 h-20 text-2xl font-black',
        '2xl': 'w-24 h-24 text-3xl font-black',
        custom: '',
    };

    // Force showing local initials badge if the imageUrl is missing, 
    // failed to load, or is a ui-avatars placeholder URL.
    const isPlaceholderUrl = imageUrl ? imageUrl.includes('ui-avatars.com') : true;
    const shouldShowInitials = imgFailed || isPlaceholderUrl || !imageUrl;

    const ringStyle = ringColor ? `ring-2 ${ringColor}` : '';

    if (shouldShowInitials) {
        return (
            <div
                className={`flex items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white font-sans tracking-wide uppercase select-none shadow-sm ${ringStyle} ${sizeClasses[size]} ${className}`}
                title={name}
            >
                {initials}
            </div>
        );
    }

    return (
        <img
            src={imageUrl}
            alt={name}
            onError={() => setImgFailed(true)}
            className={`rounded-full object-cover shadow-sm ${ringStyle} ${sizeClasses[size]} ${className}`}
        />
    );
};
