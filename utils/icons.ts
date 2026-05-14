// Icon size constants — Design System v2.2
// Usage: import { ICON_SM, ICON_MD } from '@/utils/icons'
// Always use these instead of inline w-4 h-4 to keep sizing consistent

/** 12px — micro icons in badges, compact rows */
export const ICON_XS = 'w-3 h-3' as const;

/** 14px — small icons in buttons (size=sm), table cells */
export const ICON_SM = 'w-3.5 h-3.5' as const;

/** 16px — default icon size (buttons, sidebar nav, inputs) */
export const ICON_MD = 'w-4 h-4' as const;

/** 20px — large icons in page headers, section headers */
export const ICON_LG = 'w-5 h-5' as const;

/** 24px — XL icons in empty states, illustration areas */
export const ICON_XL = 'w-6 h-6' as const;

/** 32px — feature icons in card headers, onboarding */
export const ICON_2XL = 'w-8 h-8' as const;

/** 48px — hero / empty state illustrations */
export const ICON_3XL = 'w-12 h-12' as const;

// Button size → icon size mapping (matches Button.tsx iconSizes)
export const BUTTON_ICON_SIZE: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string> = {
    xs:  ICON_XS,
    sm:  ICON_SM,
    md:  ICON_MD,
    lg:  ICON_LG,
    xl:  ICON_LG,
};
