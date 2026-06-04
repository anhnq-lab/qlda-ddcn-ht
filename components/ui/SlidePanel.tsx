import React, { useEffect, useCallback, useRef, useState } from 'react';
import { X, FileText, Layers, GripVertical, Maximize2, Minimize2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSlidePanel, PanelEntry } from '../../context/SlidePanelContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_GAP = 20;           // px base gap between sidebar and first panel
const STACKING_OFFSET = 20;   // px additional gap per stacked panel
const TAB_HEIGHT = 38;         // approximate tab height in px
const TAB_VERTICAL_GAP = 6;   // px gap between cascading tabs vertically
const MIN_PANEL_WIDTH = 400;   // minimum panel width in px
const SWIPE_THRESHOLD = 100;   // px to trigger swipe-to-close

// ─── Resize Handle ───────────────────────────────────────────────────────────

/** Props for the drag-to-resize handle on the left edge of the top-most panel. */
interface ResizeHandleProps {
    /** Called with the initial mouse X coordinate when the user starts dragging. */
    onResizeStart: (startX: number) => void;
    /** Called on double-click to reset the panel width back to the default. */
    onResetWidth: () => void;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ onResizeStart, onResetWidth }) => {
    return (
        <div
            className="slide-panel-resize-handle group/resize"
            onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onResizeStart(e.clientX);
            }}
            onDoubleClick={(e) => {
                e.preventDefault();
                onResetWidth();
            }}
            title="Kéo để thay đổi kích thước • Nhấp đúp để đặt lại"
        >
            <div className="slide-panel-resize-indicator">
                <GripVertical size={12} className="text-txt-placeholder opacity-0 group-hover/resize:opacity-100 transition-opacity" />
            </div>
        </div>
    );
};

// ─── Panel Title Bar ─────────────────────────────────────────────────────────

interface PanelTitleBarProps {
    panel: PanelEntry;
    onClose: () => void;
    panelWidth: number;
    onToggleMaximize?: () => void;
    isMaximized?: boolean;
}

const PanelTitleBar: React.FC<PanelTitleBarProps> = ({ panel, onClose, panelWidth, onToggleMaximize, isMaximized }) => {
    const isNarrow = panelWidth > 0 && panelWidth < 500;
    return (
        <div className="slide-panel-title-bar">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="slide-panel-title-icon">
                    {panel.icon || <FileText size={14} />}
                </span>
                <h3 className={`slide-panel-title-text ${isNarrow ? 'max-w-[180px]' : 'max-w-[400px]'}`}>
                    {panel.title || 'Chi tiết'}
                </h3>
            </div>
            <div className="flex items-center gap-1">
                {onToggleMaximize && (
                    <button
                        onClick={onToggleMaximize}
                        className="slide-panel-title-btn"
                        aria-label={isMaximized ? 'Thu nhỏ' : 'Phóng to'}
                        title={isMaximized ? 'Thu nhỏ' : 'Phóng to'}
                    >
                        {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="slide-panel-title-btn slide-panel-title-btn-close"
                    aria-label="Đóng"
                    title="Đóng (Esc)"
                >
                    <X size={15} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};

// ─── Single Panel ────────────────────────────────────────────────────────────

interface SlidePanelItemProps {
    panel: PanelEntry;
    index: number;
    total: number;
    onClose: () => void;
    isExiting?: boolean;
    panelWidth: number;
    isResizing: boolean;
    onResizeStart?: (startX: number) => void;
    onResetWidth?: () => void;
}

const SlidePanelItem: React.FC<SlidePanelItemProps> = ({
    panel, index, total, onClose, isExiting, panelWidth, isResizing,
    onResizeStart, onResetWidth,
}) => {
    const isTopPanel = index === total - 1;
    const stackOffset = BASE_GAP + index * STACKING_OFFSET;
    const [isMaximized, setIsMaximized] = useState(false);

    // Swipe-to-close state
    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const [swipeOffset, setSwipeOffset] = useState(0);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
        setSwipeOffset(0);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!touchStartRef.current || !isTopPanel) return;
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

        // Only track horizontal swipes (right direction)
        if (deltaX > 10 && deltaX > deltaY) {
            setSwipeOffset(Math.max(0, deltaX));
        }
    }, [isTopPanel]);

    const handleTouchEnd = useCallback(() => {
        if (!touchStartRef.current) return;
        if (swipeOffset > SWIPE_THRESHOLD) {
            onClose();
        }
        setSwipeOffset(0);
        touchStartRef.current = null;
    }, [swipeOffset, onClose]);

    // Compute width style: user-resized width (panelWidth) overrides panel.width
    const initialWidth = panel.width
        ? (typeof panel.width === 'number' ? `${panel.width}px` : panel.width)
        : `calc(50% - ${stackOffset}px)`;
    const widthValue = (isTopPanel && panelWidth > 0) ? `${panelWidth}px` : initialWidth;

    const widthStyle: React.CSSProperties = isMaximized
        ? {
            width: '100%',
            maxWidth: '100%',
        }
        : {
            width: widthValue,
            maxWidth: `calc(100% - ${stackOffset}px)`,
        };

    return (
        <div
            className="absolute inset-0 flex justify-end"
            style={{ zIndex: 60 + index }}
        >
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isExiting ? 0 : 1 }}
                transition={{ duration: 0.2 }}
                className={`absolute inset-0 transition-colors duration-200 ${isTopPanel
                    ? 'bg-black/2 dark:bg-black/10 cursor-pointer'
                    : 'bg-transparent pointer-events-none'
                    }`}
                onClick={isTopPanel ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Panel Wrapper (No overflow-hidden so handle can extend) */}
            <motion.div
                initial={{ x: '100%', opacity: 0.5 }}
                animate={{ x: isExiting ? '100%' : '0%', opacity: isExiting ? 0 : 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className="slide-panel-wrapper relative h-full flex flex-col"
                style={{
                    ...widthStyle,
                    ...(swipeOffset > 0 ? {
                        transform: `translateX(${swipeOffset}px)`,
                        opacity: Math.max(0.3, 1 - swipeOffset / 400),
                        transition: 'none',
                    } : {}),
                }}
            >
                {/* Resize handle — only on the top-most panel and when not maximized */}
                {isTopPanel && !isMaximized && !isExiting && onResizeStart && onResetWidth && (
                    <ResizeHandle
                        onResizeStart={onResizeStart}
                        onResetWidth={onResetWidth}
                    />
                )}

                {/* Actual Panel Body (stacked styles & overflow) */}
                <div
                    className={`relative w-full h-full bg-bg-surface border-l border-border
              flex flex-col overflow-hidden slide-panel-stacked
              ${isResizing ? 'slide-panel-resizing' : ''} ${panel.className || ''}`}
                    style={isTopPanel ? {} : { filter: 'brightness(0.97)' }}
                    role="dialog"
                    aria-modal={isTopPanel}
                    aria-label={panel.title || 'Panel'}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Title Bar */}
                    {isTopPanel && (
                        <PanelTitleBar
                            panel={panel}
                            onClose={onClose}
                            panelWidth={panelWidth}
                            onToggleMaximize={() => setIsMaximized(prev => !prev)}
                            isMaximized={isMaximized}
                        />
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden">
                        {typeof panel.component === 'function'
                            ? (panel.component as () => React.ReactNode)()
                            : panel.component}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Tab Ears ────────────────────────────────────────────────────────────────

interface PanelTabsOverlayProps {
    panels: PanelEntry[];
    sidebarWidth: number;
    onFocus: (id: string) => void;
    onClose: (id: string) => void;
    onCloseAll: () => void;
}

const PanelTabsOverlay: React.FC<PanelTabsOverlayProps> = ({ panels, sidebarWidth, onFocus, onClose, onCloseAll }) => {
    if (panels.length === 0) return null;

    return (
        <>
            {panels.map((panel, index) => {
                const isTopPanel = index === panels.length - 1;
                const title = panel.title || `Panel ${index + 1}`;
                const displayTitle = title.length > 12 ? title.slice(0, 12) + '…' : title;

                const panelLeftEdgeScreen = sidebarWidth + BASE_GAP + index * STACKING_OFFSET;
                const tabRightEdge = panelLeftEdgeScreen + TAB_HEIGHT;
                const tabTop = 12 + index * (TAB_HEIGHT + TAB_VERTICAL_GAP);

                return (
                    <div
                        key={panel.id}
                        className="slide-panel-tab pointer-events-auto absolute hidden md:block"
                        style={{
                            right: `calc(100% - ${tabRightEdge}px)`,
                            top: `${tabTop}px`,
                            zIndex: 60 + panels.length + index + 1,
                        }}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isTopPanel) {
                                    onFocus(panel.id);
                                }
                            }}
                            className={`group flex items-center gap-1.5 pl-3 pr-2.5 py-2
                                rounded-l-xl border border-r-0
                                transition-all duration-200
                                whitespace-nowrap
                                ${isTopPanel
                                    ? 'bg-primary-600 dark:bg-primary-500 border-primary-700 dark:border-primary-600 text-white shadow-xl shadow-primary-500/30 dark:shadow-primary-700/50'
                                    : 'bg-bg-surface border-border text-txt-secondary hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-300 dark:hover:border-primary-600 shadow-card cursor-pointer'
                                }`}
                            title={panel.title || 'Panel'}
                        >
                            {/* Icon */}
                            <span className={`flex-shrink-0 w-4 h-4 flex items-center justify-center ${isTopPanel
                                ? 'text-primary-200'
                                : 'text-txt-muted'
                                }`}>
                                {panel.icon || <FileText size={14} />}
                            </span>

                            {/* Title */}
                            <span className="text-xs font-semibold">
                                {displayTitle}
                            </span>

                            {/* × Close — ONLY on topmost panel */}
                            {isTopPanel && (
                                <span
                                    onClick={(e) => { e.stopPropagation(); onClose(panel.id); }}
                                    className="flex-shrink-0 w-5 h-5 flex items-center justify-center
                                        rounded-full ml-1
                                        text-primary-200 hover:text-white hover:bg-primary-700 dark:hover:bg-primary-600
                                        transition-all duration-150 cursor-pointer"
                                    title="Đóng"
                                >
                                    <X size={12} strokeWidth={2.5} />
                                </span>
                            )}
                        </button>
                    </div>
                );
            })}

            {/* "Close All" button — only when multiple panels are open */}
            {panels.length > 1 && (
                <div
                    className="slide-panel-tab pointer-events-auto absolute hidden md:block"
                    style={{
                        right: `calc(100% - ${sidebarWidth + BASE_GAP + TAB_HEIGHT}px)`,
                        top: `${12 + panels.length * (TAB_HEIGHT + TAB_VERTICAL_GAP)}px`,
                        zIndex: 60 + panels.length * 2 + 1,
                    }}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCloseAll();
                        }}
                        className="group flex items-center gap-1.5 pl-3 pr-3 py-2
                            rounded-l-xl border border-r-0
                            bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800
                            text-red-500 dark:text-red-400
                            hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-300
                            shadow-lg shadow-slate-900/10 dark:shadow-slate-950/30
                            transition-all duration-200 whitespace-nowrap"
                        title="Đóng tất cả panel"
                    >
                        <Layers size={14} />
                        <span className="text-xs font-semibold">Đóng tất cả</span>
                    </button>
                </div>
            )}
        </>
    );
};

// ─── Panel Container ─────────────────────────────────────────────────────────

/**
 * Props for the SlidePanelContainer.
 */
interface SlidePanelContainerProps {
    /**
     * Whether the application sidebar is currently in collapsed (icon-only) mode.
     * Used to compute the correct left offset for the panel viewport so panels
     * align flush with the sidebar edge.
     * - `true`  → sidebar is 80px wide (w-20)
     * - `false` → sidebar is 256px wide (w-64)
     */
    isSidebarCollapsed: boolean;
}

/**
 * SlidePanelContainer — stackable slide-over panel system.
 *
 * Renders all currently-open panels managed by `SlidePanelContext`.
 * Panels slide in from the right with spring animations (Framer Motion).
 *
 * ### Features
 * - **Stacking** — multiple panels stack depth-wise with a configurable offset.
 * - **Resize** — drag the left edge of the top-most panel to resize it; double-click to reset.
 * - **Lock mechanism** — panels can be locked via `lockPanel(id)` to prevent accidental
 *   closure (e.g. when a dirty form is inside). Attempting to close a locked panel
 *   triggers the registered `onCloseBlocked` callback instead of closing.
 *   Call `unlockPanel(id)` or `forceClosePanel(id)` to bypass the lock.
 * - **Keyboard** — `Escape` closes the top-most panel (respects lock).
 * - **Swipe** — on touch devices, swiping right ≥ 100px closes the top panel.
 * - **Tab ears** — collapsed panels show labelled ear-tabs on the left edge for quick re-focus.
 * - **Focus management** — locks `<body>` scroll and traps focus inside the panel viewport.
 *
 * ### Usage
 * Place once at the app layout level. Open/close panels via the `useSlidePanel()` hook:
 * ```tsx
 * const { openPanel, closePanel, lockPanel, unlockPanel } = useSlidePanel();
 *
 * // Open a panel
 * openPanel({ id: 'project-detail', title: 'Chi tiết dự án', component: <ProjectDetail /> });
 *
 * // Lock while editing
 * lockPanel('project-detail');
 *
 * // Unlock and close
 * unlockPanel('project-detail');
 * closePanel('project-detail');
 * ```
 */
export const SlidePanelContainer: React.FC<SlidePanelContainerProps> = ({ isSidebarCollapsed }) => {
    const {
        panels, closePanel, closeAllPanels, focusPanel, hasOpenPanels,
        closingPanels, isTopPanelLocked, panelWidth, setPanelWidth,
    } = useSlidePanel();

    // Resize state
    const [isResizing, setIsResizing] = useState(false);
    const resizeStartRef = useRef<{ startX: number; startWidth: number } | null>(null);
    const panelViewportRef = useRef<HTMLDivElement>(null);

    // Focus trap
    const previousFocusRef = useRef<HTMLElement | null>(null);

    const guardedClose = useCallback((id?: string) => {
        closePanel(id);
    }, [closePanel]);

    const guardedFocus = useCallback((id: string) => {
        if (isTopPanelLocked) {
            closePanel();
            return;
        }
        focusPanel(id);
    }, [focusPanel, isTopPanelLocked, closePanel]);

    // ─── Keyboard: Escape to close ────────────────────────────────
    useEffect(() => {
        if (!hasOpenPanels) return;
        const handleEscapeKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                guardedClose();
            }
        };
        window.addEventListener('keydown', handleEscapeKey, { capture: true });
        return () => window.removeEventListener('keydown', handleEscapeKey, { capture: true });
    }, [hasOpenPanels, guardedClose]);

    // ─── Focus management ─────────────────────────────────────────
    useEffect(() => {
        if (hasOpenPanels) {
            // Save current focus and lock body scroll
            previousFocusRef.current = document.activeElement as HTMLElement;
            document.body.classList.add('slide-panel-open');

            // Focus the panel container after enter animation
            const timer = setTimeout(() => {
                if (panelViewportRef.current) {
                    const firstFocusable = panelViewportRef.current.querySelector<HTMLElement>(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    firstFocusable?.focus();
                }
            }, 300);
            return () => {
                clearTimeout(timer);
                document.body.classList.remove('slide-panel-open');
            };
        } else {
            document.body.classList.remove('slide-panel-open');
            // Restore focus
            if (previousFocusRef.current) {
                previousFocusRef.current.focus();
                previousFocusRef.current = null;
            }
        }
    }, [hasOpenPanels]);

    // ─── Resize mouse move/up handlers ────────────────────────────
    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!resizeStartRef.current) return;
            const delta = resizeStartRef.current.startX - e.clientX;
            const newWidth = resizeStartRef.current.startWidth + delta;
            const maxWidth = window.innerWidth * 0.95;
            const clamped = Math.min(maxWidth, Math.max(MIN_PANEL_WIDTH, newWidth));
            setPanelWidth(clamped);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            resizeStartRef.current = null;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, setPanelWidth]);

    const handleResizeStart = useCallback((startX: number) => {
        // Compute current panel rendered width
        const currentWidth = panelWidth > 0
            ? panelWidth
            : (panelViewportRef.current?.querySelector<HTMLElement>('[role="dialog"]')?.offsetWidth || window.innerWidth * 0.7);
        resizeStartRef.current = { startX, startWidth: currentWidth };
        setIsResizing(true);
    }, [panelWidth]);

    const handleResetWidth = useCallback(() => {
        setPanelWidth(0);
    }, [setPanelWidth]);

    if (!hasOpenPanels) return null;

    const sidebarWidth = isSidebarCollapsed ? 80 : 256; // w-20 vs w-64
    const isAllExiting = panels.length > 0 && closingPanels.size === panels.length;

    return (
        <div className="fixed inset-0 z-[60]">
            {/* Full-screen backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isAllExiting ? 0 : 1 }}
                transition={{ duration: 0.2 }}
                className={`absolute inset-0 bg-black/5 dark:bg-black/20 backdrop-blur-xs transition-colors duration-200`}
                onClick={() => guardedClose()}
                aria-hidden="true"
            />

            {/* Panel viewport — after sidebar */}
            <style>{`
        @media (min-width: 1024px) {
          .slide-panel-viewport {
            left: ${sidebarWidth}px !important;
          }
        }
      `}</style>
            <div
                ref={panelViewportRef}
                className="slide-panel-viewport absolute inset-0 overflow-hidden"
                style={{ left: 0 }}
            >
                {panels.map((panel, index) => (
                    <SlidePanelItem
                        key={panel.id}
                        panel={panel}
                        index={index}
                        total={panels.length}
                        onClose={() => guardedClose(panel.id)}
                        isExiting={closingPanels.has(panel.id)}
                        panelWidth={panelWidth}
                        isResizing={isResizing}
                        onResizeStart={handleResizeStart}
                        onResetWidth={handleResetWidth}
                    />
                ))}
            </div>

            {/* Tab Ears */}
            <PanelTabsOverlay
                panels={panels}
                sidebarWidth={sidebarWidth}
                onFocus={(id) => guardedFocus(id)}
                onClose={(id) => guardedClose(id)}
                onCloseAll={closeAllPanels}
            />
        </div>
    );
};

export default SlidePanelContainer;
