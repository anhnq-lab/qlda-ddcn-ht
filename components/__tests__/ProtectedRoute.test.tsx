import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';

vi.mock('../../hooks/usePermissionCheck', () => ({
    usePermissionCheck: vi.fn(),
}));

describe('ProtectedRoute Component', () => {
    const mockCan = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows spinner when permissions are loading', () => {
        (usePermissionCheck as any).mockReturnValue({
            can: mockCan,
            loading: true,
        });

        const { container } = render(
            <MemoryRouter>
                <ProtectedRoute resource="contracts" action="view">
                    <div>Protected Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        expect(screen.queryByText('Protected Content')).toBeNull();
        // Check spinner container
        expect(container.querySelector('.animate-spin')).not.toBeNull();
    });

    it('renders children when permissions are loaded and user has access', () => {
        (usePermissionCheck as any).mockReturnValue({
            can: mockCan,
            loading: false,
        });
        mockCan.mockReturnValue(true);

        render(
            <MemoryRouter>
                <ProtectedRoute resource="contracts" action="view">
                    <div>Protected Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        expect(screen.getByText('Protected Content')).toBeDefined();
        expect(mockCan).toHaveBeenCalledWith('contracts', 'view');
    });

    it('redirects to fallback route when user lacks permission', () => {
        (usePermissionCheck as any).mockReturnValue({
            can: mockCan,
            loading: false,
        });
        mockCan.mockReturnValue(false);

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route
                        path="/protected"
                        element={
                            <ProtectedRoute resource="contracts" action="view" fallback="/denied">
                                <div>Protected Content</div>
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/denied" element={<div>Access Denied Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.queryByText('Protected Content')).toBeNull();
        expect(screen.getByText('Access Denied Page')).toBeDefined();
    });
});
