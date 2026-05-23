import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PermissionGate from '../PermissionGate';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';

// Mock hook
vi.mock('../../hooks/usePermissionCheck', () => ({
    usePermissionCheck: vi.fn(),
}));

describe('PermissionGate Component', () => {
    const mockCan = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (usePermissionCheck as any).mockReturnValue({
            can: mockCan,
        });
    });

    it('renders children when user has single permission', () => {
        mockCan.mockReturnValue(true);

        render(
            <PermissionGate resource="contracts" action="create">
                <div>Allowed Content</div>
            </PermissionGate>
        );

        expect(screen.getByText('Allowed Content')).toBeDefined();
        expect(mockCan).toHaveBeenCalledWith('contracts', 'create');
    });

    it('renders fallback when user lacks single permission', () => {
        mockCan.mockReturnValue(false);

        render(
            <PermissionGate resource="contracts" action="create" fallback={<div>Access Denied</div>}>
                <div>Allowed Content</div>
            </PermissionGate>
        );

        expect(screen.queryByText('Allowed Content')).toBeNull();
        expect(screen.getByText('Access Denied')).toBeDefined();
    });

    it('renders children when user has any of specified anyAction permissions', () => {
        mockCan.mockImplementation((res, act) => act === 'view' || act === 'update');

        render(
            <PermissionGate resource="contracts" anyAction={['update', 'create']}>
                <div>Allowed Content</div>
            </PermissionGate>
        );

        expect(screen.getByText('Allowed Content')).toBeDefined();
    });

    it('renders fallback when user lacks all specified anyAction permissions', () => {
        mockCan.mockReturnValue(false);

        render(
            <PermissionGate resource="contracts" anyAction={['update', 'create']} fallback={<div>Access Denied</div>}>
                <div>Allowed Content</div>
            </PermissionGate>
        );

        expect(screen.queryByText('Allowed Content')).toBeNull();
        expect(screen.getByText('Access Denied')).toBeDefined();
    });
});
