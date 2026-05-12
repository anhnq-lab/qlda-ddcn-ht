/**
 * PersonalDashboard — Dynamic Dashboard Orchestrator
 * 
 * Renders the appropriate dashboard tier based on the user's role and department:
 * - Director/Deputy Director → DirectorDashboard
 * - Dept Head/Deputy Head → ManagerDashboard  
 * - Specialist/Staff → StaffDashboard
 * 
 * All tier components receive the same config + department data hooks.
 */
import React, { Suspense, lazy } from 'react';
import { useDashboardConfig } from './hooks/useDashboardConfig';
import { useDepartmentData } from './hooks/useDepartmentData';
import PageLoadingFallback from '../../components/ui/PageLoadingFallback';

// Lazy load tier components
const DirectorDashboard = lazy(() => import('./tiers/DirectorDashboard'));
const ManagerDashboard = lazy(() => import('./tiers/ManagerDashboard'));
const StaffDashboard = lazy(() => import('./tiers/StaffDashboard'));

const PersonalDashboard: React.FC = () => {
    const config = useDashboardConfig();
    const data = useDepartmentData(config);

    return (
        <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
            <Suspense fallback={<PageLoadingFallback />}>
                {config.tier === 'director' && (
                    <DirectorDashboard config={config} data={data} />
                )}
                {config.tier === 'manager' && (
                    <ManagerDashboard config={config} data={data} />
                )}
                {config.tier === 'staff' && (
                    <StaffDashboard config={config} data={data} />
                )}
            </Suspense>
        </div>
    );
};

export default PersonalDashboard;
