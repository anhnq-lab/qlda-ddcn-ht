import React from 'react';
import { Skeleton, SkeletonText, SkeletonStatCard } from './Skeleton';

/**
 * Global page-level loading fallback for React.Suspense.
 * Displays a skeleton layout that mimics the main page structure.
 */
const PageLoadingFallback: React.FC = () => {
    return (
        <div className="animate-fadeIn p-6 space-y-6">
            {/* Page Header Skeleton */}
            <div className="flex items-center justify-between mb-2">
                <div className="space-y-2">
                    <Skeleton variant="text" width={240} height={28} />
                    <Skeleton variant="text" width={160} height={16} />
                </div>
                <Skeleton variant="rounded" width={120} height={40} />
            </div>

            {/* Stat Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
            </div>

            {/* Content Area */}
            <div className="bg-bg-surface rounded-2xl border border-border p-6">
                {/* Toolbar */}
                <div className="flex items-center gap-3 mb-6">
                    <Skeleton variant="rounded" width={200} height={38} />
                    <Skeleton variant="rounded" width={120} height={38} />
                    <div className="flex-1" />
                    <Skeleton variant="rounded" width={100} height={38} />
                </div>

                {/* Table skeleton */}
                <div className="space-y-3">
                    {/* Table header */}
                    <div className="flex gap-4 pb-3 border-b border-border">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} variant="text" height={14} className="flex-1" />
                        ))}
                    </div>
                    {/* Table rows */}
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className="flex gap-4 py-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} variant="text" className="flex-1" />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PageLoadingFallback;
