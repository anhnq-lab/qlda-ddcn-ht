import React from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

// ========================================
// POPOVER — Design System v2.2
// Styled wrapper around @radix-ui/react-popover
// ========================================

export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;
export const PopoverAnchor = RadixPopover.Anchor;

export const PopoverContent = React.forwardRef<
    React.ElementRef<typeof RadixPopover.Content>,
    React.ComponentPropsWithoutRef<typeof RadixPopover.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
    <RadixPopover.Portal>
        <RadixPopover.Content
            ref={ref}
            align={align}
            sideOffset={sideOffset}
            className={cn(
                'z-50 w-72 rounded-xl border p-4 shadow-dropdown outline-none',
                'bg-[var(--bg-surface)] border-[var(--border-default)]',
                'text-[var(--text-primary)]',
                'data-[state=open]:animate-fade-in-down data-[state=closed]:animate-fade-out',
                className
            )}
            {...props}
        />
    </RadixPopover.Portal>
));
PopoverContent.displayName = RadixPopover.Content.displayName;

export const PopoverClose = React.forwardRef<
    React.ElementRef<typeof RadixPopover.Close>,
    React.ComponentPropsWithoutRef<typeof RadixPopover.Close>
>(({ className, ...props }, ref) => (
    <RadixPopover.Close
        ref={ref}
        className={cn(
            'absolute right-3 top-3 rounded-lg p-1',
            'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            'hover:bg-[var(--bg-muted)] transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
            className
        )}
        {...props}
    >
        <X className="h-4 w-4" />
        <span className="sr-only">Đóng</span>
    </RadixPopover.Close>
));
PopoverClose.displayName = RadixPopover.Close.displayName;
