import React from 'react';
import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { cn } from '../../lib/utils';

// ========================================
// DROPDOWN MENU — Design System v2.2
// Styled wrapper around @radix-ui/react-dropdown-menu
// Shared styles applied once here, not inline per feature
// ========================================

const contentStyles = cn(
    'z-50 min-w-[8rem] overflow-hidden rounded-xl border shadow-dropdown',
    'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    'text-slate-900 dark:text-slate-100',
    'data-[state=open]:animate-fade-in-down data-[state=closed]:animate-fade-out',
    'p-1'
);

const itemStyles = cn(
    'relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2',
    'text-sm text-slate-700 dark:text-slate-200',
    'outline-none transition-colors duration-150',
    'focus:bg-slate-100 dark:focus:bg-slate-700 focus:text-slate-900 dark:focus:text-white',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
);

const separatorStyles = 'my-1 h-px bg-slate-200 dark:bg-slate-700';

const labelStyles = 'px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400';

// ── Root ──────────────────────────────────────────────────────
export const DropdownMenu = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;
export const DropdownMenuGroup = RadixDropdown.Group;
export const DropdownMenuPortal = RadixDropdown.Portal;
export const DropdownMenuSub = RadixDropdown.Sub;
export const DropdownMenuRadioGroup = RadixDropdown.RadioGroup;

// ── Content ───────────────────────────────────────────────────
export const DropdownMenuContent = React.forwardRef<
    React.ElementRef<typeof RadixDropdown.Content>,
    React.ComponentPropsWithoutRef<typeof RadixDropdown.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
    <RadixDropdown.Portal>
        <RadixDropdown.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(contentStyles, className)}
            {...props}
        />
    </RadixDropdown.Portal>
));
DropdownMenuContent.displayName = RadixDropdown.Content.displayName;

// ── Item ──────────────────────────────────────────────────────
export const DropdownMenuItem = React.forwardRef<
    React.ElementRef<typeof RadixDropdown.Item>,
    React.ComponentPropsWithoutRef<typeof RadixDropdown.Item> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
    <RadixDropdown.Item
        ref={ref}
        className={cn(itemStyles, inset && 'pl-8', className)}
        {...props}
    />
));
DropdownMenuItem.displayName = RadixDropdown.Item.displayName;

// ── Checkbox Item ─────────────────────────────────────────────
export const DropdownMenuCheckboxItem = React.forwardRef<
    React.ElementRef<typeof RadixDropdown.CheckboxItem>,
    React.ComponentPropsWithoutRef<typeof RadixDropdown.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
    <RadixDropdown.CheckboxItem
        ref={ref}
        className={cn(itemStyles, 'pl-8', className)}
        checked={checked}
        {...props}
    >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <RadixDropdown.ItemIndicator>
                <Check className="h-4 w-4 text-primary-500" />
            </RadixDropdown.ItemIndicator>
        </span>
        {children}
    </RadixDropdown.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = RadixDropdown.CheckboxItem.displayName;

// ── Radio Item ────────────────────────────────────────────────
export const DropdownMenuRadioItem = React.forwardRef<
    React.ElementRef<typeof RadixDropdown.RadioItem>,
    React.ComponentPropsWithoutRef<typeof RadixDropdown.RadioItem>
>(({ className, children, ...props }, ref) => (
    <RadixDropdown.RadioItem
        ref={ref}
        className={cn(itemStyles, 'pl-8', className)}
        {...props}
    >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <RadixDropdown.ItemIndicator>
                <Circle className="h-2 w-2 fill-primary-500 text-primary-500" />
            </RadixDropdown.ItemIndicator>
        </span>
        {children}
    </RadixDropdown.RadioItem>
));
DropdownMenuRadioItem.displayName = RadixDropdown.RadioItem.displayName;

// ── Sub Trigger ───────────────────────────────────────────────
export const DropdownMenuSubTrigger = React.forwardRef<
    React.ElementRef<typeof RadixDropdown.SubTrigger>,
    React.ComponentPropsWithoutRef<typeof RadixDropdown.SubTrigger> & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => (
    <RadixDropdown.SubTrigger
        ref={ref}
        className={cn(itemStyles, 'data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-700', inset && 'pl-8', className)}
        {...props}
    >
        {children}
        <ChevronRight className="ml-auto h-4 w-4" />
    </RadixDropdown.SubTrigger>
));
DropdownMenuSubTrigger.displayName = RadixDropdown.SubTrigger.displayName;

// ── Sub Content ───────────────────────────────────────────────
export const DropdownMenuSubContent = React.forwardRef<
    React.ElementRef<typeof RadixDropdown.SubContent>,
    React.ComponentPropsWithoutRef<typeof RadixDropdown.SubContent>
>(({ className, ...props }, ref) => (
    <RadixDropdown.SubContent
        ref={ref}
        className={cn(contentStyles, className)}
        {...props}
    />
));
DropdownMenuSubContent.displayName = RadixDropdown.SubContent.displayName;

// ── Label ─────────────────────────────────────────────────────
export const DropdownMenuLabel = React.forwardRef<
    React.ElementRef<typeof RadixDropdown.Label>,
    React.ComponentPropsWithoutRef<typeof RadixDropdown.Label> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
    <RadixDropdown.Label
        ref={ref}
        className={cn(labelStyles, inset && 'pl-8', className)}
        {...props}
    />
));
DropdownMenuLabel.displayName = RadixDropdown.Label.displayName;

// ── Separator ─────────────────────────────────────────────────
export const DropdownMenuSeparator = React.forwardRef<
    React.ElementRef<typeof RadixDropdown.Separator>,
    React.ComponentPropsWithoutRef<typeof RadixDropdown.Separator>
>(({ className, ...props }, ref) => (
    <RadixDropdown.Separator
        ref={ref}
        className={cn(separatorStyles, className)}
        {...props}
    />
));
DropdownMenuSeparator.displayName = RadixDropdown.Separator.displayName;

// ── Shortcut ──────────────────────────────────────────────────
export const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
    <span
        className={cn('ml-auto text-[10px] tracking-widest text-slate-500 dark:text-slate-400', className)}
        {...props}
    />
);
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';
