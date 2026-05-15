import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useBiddingPackages } from '../../hooks/useBiddingPackages';
import { BiddingPackageDetail } from './components/BiddingPackageDetail';

/**
 * PackageDetail — Route-level page for /projects/:projectId/packages/:packageId
 *
 * Loads the bidding package by ID and renders the full BiddingPackageDetail
 * lifecycle component (KHLCNT → Selection → Contract → Settlement).
 */
const PackageDetail: React.FC = () => {
    const { projectId = '', packageId = '' } = useParams<{ projectId: string; packageId: string }>();
    const navigate = useNavigate();

    const { data: packages, isLoading, error } = useBiddingPackages(projectId);

    const pkg = packages?.find(p => p.PackageID === packageId) ?? null;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64 gap-3 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                <span className="font-medium">Đang tải dữ liệu gói thầu…</span>
            </div>
        );
    }

    if (error || (!isLoading && !pkg)) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size={"icon" as any} onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-slate-200">Chi tiết gói thầu</h1>
                </div>
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400">
                    <AlertTriangle className="w-10 h-10 text-warning-400" />
                    <p className="font-medium">
                        {error ? 'Không thể tải dữ liệu gói thầu.' : 'Không tìm thấy gói thầu này.'}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                        Quay lại
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Back navigation */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size={"icon" as any} onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-widest font-bold">
                        Gói thầu
                    </p>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 leading-tight">
                        {pkg!.PackageName}
                    </h1>
                </div>
            </div>

            {/* Full detail panel rendered inline (not as slide/modal) */}
            <BiddingPackageDetail
                isOpen={true}
                onClose={() => navigate(-1)}
                package_data={pkg}
                asSlidePanel={false}
            />
        </div>
    );
};

export default PackageDetail;
