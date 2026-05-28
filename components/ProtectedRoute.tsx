/**
 * ProtectedRoute — QLDA ĐDCN TP.HCM
 *
 * Wraps a route to require a specific permission.
 * If user lacks permission, redirects to Dashboard.
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissionCheck } from '../hooks/usePermissionCheck';
import type { PermissionAction, PermissionResource } from '../types/permission.types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    resource: PermissionResource;
    action?: PermissionAction;
    fallback?: string;
}

/**
 * Usage:
 * <Route path="/user-accounts" element={
 *   <ProtectedRoute resource="admin_accounts" action="view">
 *     <UserAccountManager />
 *   </ProtectedRoute>
 * } />
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    resource,
    action = 'view' as PermissionAction,
    fallback = '/',
}) => {
    const { can, loading } = usePermissionCheck();
    const { userType } = useAuth();
    // Contractors denied fallback → send to /cde (their home) to avoid double-redirect via ContractorAwareHome
    const resolvedFallback = fallback === '/' && userType === 'contractor' ? '/cde' : fallback;

    // Still loading permissions → show nothing (avoid flash)
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!can(resource, action)) {
        console.warn(`[ProtectedRoute] Access denied: ${resource}/${action}`);
        return <Navigate to={resolvedFallback} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
