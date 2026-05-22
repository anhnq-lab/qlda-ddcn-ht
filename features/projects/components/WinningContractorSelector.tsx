import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, X, Crown, Users, Award, Loader2, Check,
    Building2, ChevronDown, Save, Trash2, UserPlus
} from 'lucide-react';
import { Contractor, PackageStatus } from '../../../types';
import { useContractors } from '../../../hooks/useContractors';
import { supabase } from '../../../lib/supabase';
import { useSlidePanel } from '../../../context/SlidePanelContext';
import { ContractorFormPanel } from '../../contractors/ContractorFormPanel';
import ProjectService from '../../../services/ProjectService';

// ========================================
// WINNING CONTRACTOR SELECTOR
// Supports consortium (liên danh) — multiple contractors per package
// ========================================

interface WinningMember {
    id?: string;
    contractor_id: string;
    contractor?: Contractor;
    role: 'lead' | 'member';
    share_percent?: number;
}

interface WinningContractorSelectorProps {
    packageId: string;
    filterByBidders?: boolean;
    onSaved?: () => void;
    onCancel?: () => void;
    initialMembers?: WinningMember[];
    initialWinningPrice?: number | null;
    initialApprovalDate?: string | null;
    initialDecisionNumber?: string | null;
}

// Helper functions to format numbers with dots (thousands separator)
const formatNumberWithDots = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '';
    const raw = val.toString().replace(/\D/g, '');
    if (!raw) return '';
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const getRawNumberString = (formattedVal: string): string => {
    return formattedVal.replace(/\D/g, '');
};

export const WinningContractorSelector: React.FC<WinningContractorSelectorProps> = ({
    packageId,
    filterByBidders = false,
    onSaved,
    onCancel,
    initialMembers,
    initialWinningPrice,
    initialApprovalDate,
    initialDecisionNumber,
}) => {
    const queryClient = useQueryClient();
    const { contractors } = useContractors();
    const { openPanel } = useSlidePanel();
    const [members, setMembers] = useState<WinningMember[]>(() => {
        if (initialMembers && initialMembers.length > 0) {
            return initialMembers.map(m => ({
                ...m,
                contractor: m.contractor || contractors.find(c => c.ContractorID === m.contractor_id)
            }));
        }
        return [];
    });
    const [searchText, setSearchText] = useState('');
    const [winningPrice, setWinningPrice] = useState<string>(() => formatNumberWithDots(initialWinningPrice));
    const [approvalDate, setApprovalDate] = useState<string>(() => initialApprovalDate || '');
    const [decisionNumber, setDecisionNumber] = useState<string>(() => initialDecisionNumber || '');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    // Fetch bidding package to see if a winning contractor is already selected
    const { data: pkg, isLoading } = useQuery({
        queryKey: ['bidding-package-winner', packageId],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('bidding_packages')
                .select('winning_contractor_id, winning_price, approval_date_result, decision_number, winning_consortium')
                .eq('package_id', packageId)
                .single();
            if (error) throw error;
            return {
                WinningContractorID: data.winning_contractor_id as string | null,
                WinningPrice: data.winning_price as number | null,
                ApprovalDate_Result: data.approval_date_result as string | null,
                DecisionNumber: data.decision_number as string | null,
                WinningConsortium: data.winning_consortium as any[] | null,
            };
        },
    });

    // Sync existing data when loaded
    useEffect(() => {
        if (initialMembers && initialMembers.length > 0) {
            const mapped = initialMembers.map(m => ({
                ...m,
                contractor: m.contractor || contractors.find(c => c.ContractorID === m.contractor_id)
            }));
            setMembers(mapped);
            setWinningPrice(formatNumberWithDots(initialWinningPrice));
            setApprovalDate(initialApprovalDate || '');
            setDecisionNumber(initialDecisionNumber || '');
        } else if (!initialMembers && pkg && contractors.length > 0) {
            if (pkg.WinningConsortium && pkg.WinningConsortium.length > 0) {
                const mappedMembers = pkg.WinningConsortium.map((m: any) => ({
                    id: m.contractor_id,
                    contractor_id: m.contractor_id,
                    contractor: contractors.find(c => c.ContractorID === m.contractor_id),
                    role: m.role || 'member',
                    share_percent: m.share_percent || 0
                }));
                setMembers(mappedMembers);
                setWinningPrice(formatNumberWithDots(pkg.WinningPrice));
                setApprovalDate(pkg.ApprovalDate_Result || '');
                setDecisionNumber(pkg.DecisionNumber || '');
            } else if (pkg.WinningContractorID) {
                setMembers([{
                    id: pkg.WinningContractorID,
                    contractor_id: pkg.WinningContractorID,
                    contractor: contractors.find(c => c.ContractorID === pkg.WinningContractorID),
                    role: 'lead',
                    share_percent: 100,
                }]);
                setWinningPrice(formatNumberWithDots(pkg.WinningPrice));
                setApprovalDate(pkg.ApprovalDate_Result || '');
                setDecisionNumber(pkg.DecisionNumber || '');
            } else {
                setMembers([]);
                setWinningPrice('');
                setApprovalDate('');
                setDecisionNumber('');
            }
        }
    }, [initialMembers, pkg, contractors, initialWinningPrice, initialApprovalDate, initialDecisionNumber]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async (args: {
            newMembers: WinningMember[];
            winningPriceVal: string;
            approvalDateVal: string;
            decisionNumberVal: string;
        }) => {
            const { newMembers, winningPriceVal, approvalDateVal, decisionNumberVal } = args;
            if (newMembers.length > 0) {
                // If the user selected multiple, we still only save the lead in bidding_packages
                const leadContractor = newMembers.find(m => m.role === 'lead') || newMembers[0];
                
                // Parse the winning price from state, if not specified fallback to bid_price query
                const rawPrice = getRawNumberString(winningPriceVal);
                let finalWinningPrice: number | null = rawPrice ? parseFloat(rawPrice) : null;
                
                if (finalWinningPrice === null || isNaN(finalWinningPrice)) {
                    // Try to get bid price from package_bidders as fallback
                    try {
                        const { data } = await (supabase as any)
                            .from('package_bidders')
                            .select('bid_price')
                            .eq('package_id', packageId)
                            .eq('contractor_id', leadContractor.contractor_id)
                            .single();
                        if (data && data.bid_price) {
                            finalWinningPrice = data.bid_price;
                        }
                    } catch (e) {
                        // Expected: no bidder entry to fallback to
                    }
                }

                // Auto-transition status based on presence of approval date
                const nextStatus = approvalDateVal ? PackageStatus.Execution : PackageStatus.Selection;

                await ProjectService.updatePackage(packageId, {
                    WinningContractorID: leadContractor.contractor_id,
                    WinningPrice: finalWinningPrice,
                    ApprovalDate_Result: approvalDateVal || null as any,
                    DecisionNumber: decisionNumberVal || null as any,
                    Status: nextStatus,
                    WinningConsortium: newMembers.map(m => ({
                        contractor_id: m.contractor_id,
                        role: m.role,
                        share_percent: m.share_percent || (m.role === 'lead' ? 100 : 0)
                    }))
                });
            } else {
                // Clear winning contractor info and revert status to Selection
                await ProjectService.updatePackage(packageId, {
                    WinningContractorID: null as any,
                    WinningPrice: null as any,
                    ApprovalDate_Result: null as any,
                    DecisionNumber: null as any,
                    Status: PackageStatus.Selection,
                    WinningConsortium: null
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bidding-package-winner', packageId] });
            queryClient.invalidateQueries({ queryKey: ['bidding-package', packageId] });
            queryClient.invalidateQueries({ queryKey: ['project-packages'] });
            onSaved?.();
        },
    });

    // Fetch participating contractors
    const { data: participatingBidders = [] } = useQuery({
        queryKey: ['package-bidders-ids', packageId],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('package_bidders')
                .select('contractor_id')
                .eq('package_id', packageId);
            if (error) throw error;
            return data.map((b: any) => b.contractor_id) as string[];
        },
    });

    // Filter contractors for search
    const filteredContractors = useMemo(() => {
        const selectedIds = new Set(members.map(m => m.contractor_id));
        const participatingIds = new Set(participatingBidders);
        
        return contractors
            .filter(c => !selectedIds.has(c.ContractorID))
            .filter(c => !filterByBidders || participatingIds.has(c.ContractorID))
            .filter(c => {
                if (!searchText.trim()) return true;
                const search = searchText.toLowerCase();
                return (
                    c.FullName?.toLowerCase().includes(search) ||
                    c.ContractorID?.toLowerCase().includes(search) ||
                    c.TaxCode?.toLowerCase().includes(search)
                );
            })
            .slice(0, 10);
    }, [contractors, members, searchText, participatingBidders, filterByBidders]);

    // Click outside to close dropdown
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        try {
            const dataStr = e.dataTransfer.getData('application/json');
            if (!dataStr) return;
            const data = JSON.parse(dataStr);
            if (data.type === 'contractor' && data.contractor_id) {
                // Ignore if already selected
                if (members.some(m => m.contractor_id === data.contractor_id)) {
                    return;
                }
                
                const contractor = contractors.find(c => c.ContractorID === data.contractor_id);
                if (!contractor) return;
                
                // Set as the only lead member and update db immediately
                const newMembers = [{
                    id: data.contractor_id,
                    contractor_id: data.contractor_id,
                    contractor: contractor,
                    role: 'lead' as const,
                    share_percent: 100
                }];
                setMembers(newMembers);
                saveMutation.mutate({
                    newMembers,
                    winningPriceVal: winningPrice,
                    approvalDateVal: approvalDate,
                    decisionNumberVal: decisionNumber,
                });
            }
        } catch (err) {
            console.error('Drop error:', err);
        }
    };

    const addContractor = async (c: Contractor) => {
        const role = members.length === 0 ? 'lead' : 'member';
        setMembers(prev => [...prev, {
            contractor_id: c.ContractorID,
            contractor: c,
            role,
        }]);
        setSearchText('');
        setIsDropdownOpen(false);

        // Fetch bid price to prefill
        try {
            const { data } = await (supabase as any)
                .from('package_bidders')
                .select('bid_price')
                .eq('package_id', packageId)
                .eq('contractor_id', c.ContractorID)
                .single();
            if (data && data.bid_price) {
                setWinningPrice(formatNumberWithDots(data.bid_price));
            }
        } catch (e) {
            // Expected: no bidder entry found to prefill
        }
    };

    const removeContractor = (contractorId: string) => {
        setMembers(prev => {
            const next = prev.filter(m => m.contractor_id !== contractorId);
            // Auto-promote first member to lead if lead was removed
            if (next.length > 0 && !next.some(m => m.role === 'lead')) {
                next[0].role = 'lead';
            }
            return next;
        });
    };

    const toggleRole = (contractorId: string) => {
        setMembers(prev => prev.map(m => {
            if (m.contractor_id === contractorId) {
                return { ...m, role: m.role === 'lead' ? 'member' : 'lead' };
            }
            // If switching to lead, demote others
            if (m.role === 'lead') {
                return { ...m, role: 'member' };
            }
            return m;
        }));
    };

    const handleSave = () => {
        saveMutation.mutate({
            newMembers: members,
            winningPriceVal: winningPrice,
            approvalDateVal: approvalDate,
            decisionNumberVal: decisionNumber,
        });
    };

    if (isLoading && (!initialMembers)) {
        return (
            <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            </div>
        );
    }

    // Edit mode
    return (
        <div 
            className={`space-y-3 p-2 -mx-2 rounded-xl transition-all duration-200 border-2 ${isDragOver ? 'border-dashed border-green-500 bg-green-50/30' : 'border-transparent'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Selected members */}
            {members.map(m => (
                <div
                    key={m.contractor_id}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border ${m.role === 'lead'
                        ? 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-200/60 dark:border-amber-900/30 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                        }`}
                >
                    <button
                        onClick={() => toggleRole(m.contractor_id)}
                        title={members.length > 1 ? (m.role === 'lead' ? 'Nhà thầu đại diện liên danh' : 'Click để đặt làm nhà thầu đại diện liên danh') : 'Nhà thầu trúng thầu'}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${m.role === 'lead'
                            ? 'bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 border border-amber-200/50 dark:border-amber-800/40'
                            : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
                            }`}
                    >
                        {m.role === 'lead' ? (
                            <Crown className="w-4 h-4 text-amber-500 animate-pulse-subtle" />
                        ) : (
                            <Building2 className="w-4 h-4 text-gray-400" />
                        )}
                    </button>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">
                            {m.contractor?.FullName || m.contractor_id}
                        </p>
                        <span className="text-[10px] text-gray-500 dark:text-slate-400">
                            {members.length > 1 ? (
                                m.role === 'lead' ? (
                                    <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium">
                                        👑 Nhà thầu đại diện
                                    </span>
                                ) : (
                                    'Thành viên liên danh'
                                )
                            ) : (
                                'Nhà thầu trúng thầu'
                            )}
                        </span>
                    </div>
                    <button
                        onClick={() => removeContractor(m.contractor_id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}

            {/* Consortium UX Helper Hint Banner */}
            {members.length > 0 && (
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-start gap-2.5 text-xs text-blue-700 dark:text-blue-300">
                    <span className="shrink-0 mt-0.5 text-blue-500">💡</span>
                    <div>
                        <p className="font-semibold mb-0.5">Mẹo liên danh:</p>
                        <p className="text-blue-600/90 dark:text-blue-400/90 leading-normal">
                            Nếu gói thầu có liên danh nhà thầu, bạn chỉ cần tiếp tục tìm kiếm và chọn thêm các thành viên liên danh khác ở ô dưới. Hệ thống sẽ tự động ghép thành liên danh trúng thầu.
                        </p>
                    </div>
                </div>
            )}

            {/* Search & Add */}
            <div ref={dropdownRef} className="relative">
                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-400">
                    <Search className="w-4 h-4 text-gray-400 dark:text-slate-400 shrink-0" />
                    <input
                        ref={searchRef}
                        type="text"
                        placeholder="Tìm nhà thầu (tên, mã số thuế)..."
                        value={searchText}
                        onChange={(e) => {
                            setSearchText(e.target.value);
                            setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className="flex-1 bg-transparent text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 outline-none"
                    />
                    {searchText && (
                        <button onClick={() => { setSearchText(''); setIsDropdownOpen(false); }}>
                            <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                    )}
                </div>

                {/* Dropdown results */}
                {isDropdownOpen && (
                    <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm max-h-48 overflow-y-auto">
                        {filteredContractors.length > 0 ? (
                            <>
                                {filteredContractors.map(c => (
                                    <button
                                        key={c.ContractorID}
                                        onClick={() => addContractor(c)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700 text-left transition-colors border-b border-gray-50 dark:border-slate-750 last:border-0"
                                    >
                                        <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                                            <Building2 className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-800 dark:text-slate-200 truncate">{c.FullName}</p>
                                            <p className="text-[10px] text-gray-500 dark:text-slate-400">MST: {c.TaxCode || c.ContractorID}</p>
                                        </div>
                                        <Plus className="w-4 h-4 text-blue-400 shrink-0" />
                                    </button>
                                ))}
                                <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-750 p-2 flex justify-center shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
                                    <button
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            openPanel({
                                                title: "Thêm nhà thầu mới",
                                                component: <ContractorFormPanel onSuccess={() => queryClient.invalidateQueries({ queryKey: ['contractors'] })} />
                                            });
                                        }}
                                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-semibold rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors border border-primary-100/50 dark:border-primary-850/30"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Thêm nhà thầu mới
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="px-3 py-4 text-center">
                                <p className="text-sm text-gray-400 dark:text-slate-400 mb-3">
                                    {searchText ? 'Không tìm thấy nhà thầu' : 'Nhập tên hoặc MST để tìm kiếm'}
                                </p>
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        openPanel({
                                            title: "Thêm nhà thầu mới",
                                            component: <ContractorFormPanel onSuccess={() => queryClient.invalidateQueries({ queryKey: ['contractors'] })} />
                                        });
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-semibold rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors border border-primary-100/50 dark:border-primary-850/30"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Thêm nhà thầu mới
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Price Input — Giá trúng thầu */}
            {members.length > 0 && (
                <div className="space-y-3 mt-3">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            Giá trúng thầu (VNĐ)
                        </label>
                        <input
                            type="text"
                            placeholder="Nhập giá trúng thầu..."
                            value={winningPrice}
                            onChange={(e) => setWinningPrice(formatNumberWithDots(e.target.value))}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-850 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                QĐ phê duyệt KQLCNT
                            </label>
                            <input
                                type="text"
                                placeholder="Số quyết định..."
                                value={decisionNumber}
                                onChange={(e) => setDecisionNumber(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-850 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                Ngày phê duyệt <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="date"
                                value={approvalDate}
                                onChange={(e) => setApprovalDate(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            />
                        </div>
                    </div>
                    {!approvalDate && members.length > 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            ⚠️ Nhập ngày phê duyệt để có thể chuyển gói thầu sang "Đang thực hiện"
                        </p>
                    )}
                </div>
            )}

            {/* Actions */}
            {(members.length > 0 || !!pkg?.WinningContractorID || (initialMembers && initialMembers.length > 0)) && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                    <button
                        onClick={() => {
                            if (onCancel) {
                                onCancel();
                            } else if (onSaved) {
                                onSaved();
                            }
                        }}
                        className="px-3 py-1.5 text-xs text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saveMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {saveMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Save className="w-3.5 h-3.5" />
                        )}
                        Lưu kết quả
                    </button>
                </div>
            )}

            {/* Empty hint */}
            {members.length === 0 && (
                <div className="text-center py-2">
                    <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">
                        Tìm và chọn nhà thầu trúng thầu từ danh sách. Hỗ trợ liên danh.
                    </p>
                </div>
            )}
        </div>
    );
};

export default WinningContractorSelector;
