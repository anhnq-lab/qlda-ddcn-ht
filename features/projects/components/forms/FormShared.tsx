import React, { useState, useEffect } from 'react';
import { ConstructionType } from '../../../../utils/projectCodeGenerator';

export const CONSTRUCTION_TYPES = [
    { value: ConstructionType.Civil, label: 'Dân dụng' },
    { value: ConstructionType.Industrial, label: 'Công nghiệp' },
    { value: ConstructionType.Transport, label: 'Giao thông' },
    { value: ConstructionType.Agriculture, label: 'Nông nghiệp & PTNT' },
    { value: ConstructionType.Infrastructure, label: 'Hạ tầng kỹ thuật' },
    { value: ConstructionType.Defense, label: 'Quốc phòng, an ninh' },
];

export const CONSTRUCTION_GRADES = [
    { value: 'ĐB', label: 'Đặc biệt' },
    { value: 'I', label: 'Cấp I' },
    { value: 'II', label: 'Cấp II' },
    { value: 'III', label: 'Cấp III' },
    { value: 'IV', label: 'Cấp IV' },
];

export const PROVINCES = [
    { code: '01', name: 'TP. Hà Nội' },
    { code: '04', name: 'Cao Bằng' },
    { code: '08', name: 'Tuyên Quang' },
    { code: '11', name: 'Điện Biên' },
    { code: '12', name: 'Lai Châu' },
    { code: '14', name: 'Sơn La' },
    { code: '15', name: 'Lào Cai' },
    { code: '19', name: 'Thái Nguyên' },
    { code: '20', name: 'Lạng Sơn' },
    { code: '22', name: 'Quảng Ninh' },
    { code: '24', name: 'Bắc Ninh' },
    { code: '25', name: 'Phú Thọ' },
    { code: '31', name: 'TP. Hải Phòng' },
    { code: '33', name: 'Hưng Yên' },
    { code: '37', name: 'Ninh Bình' },
    { code: '38', name: 'Thanh Hóa' },
    { code: '40', name: 'Nghệ An' },
    { code: '42', name: 'Hà Tĩnh' },
    { code: '44', name: 'Quảng Trị' },
    { code: '46', name: 'TP. Huế' },
    { code: '48', name: 'TP. Đà Nẵng' },
    { code: '51', name: 'Quảng Ngãi' },
    { code: '52', name: 'Gia Lai' },
    { code: '56', name: 'Khánh Hòa' },
    { code: '66', name: 'Đắk Lắk' },
    { code: '68', name: 'Lâm Đồng' },
    { code: '75', name: 'Đồng Nai' },
    { code: '79', name: 'TP. Hồ Chí Minh' },
    { code: '80', name: 'Tây Ninh' },
    { code: '82', name: 'Đồng Tháp' },
    { code: '86', name: 'Vĩnh Long' },
    { code: '91', name: 'An Giang' },
    { code: '92', name: 'TP. Cần Thơ' },
    { code: '96', name: 'Cà Mau' },
];

export const inputClass = "w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all shadow-sm";
export const inputWithIconClass = "w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all shadow-sm";
export const selectClass = "w-full px-3 py-2 text-sm rounded-xl border border-solid border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all shadow-sm";
export const selectWithIconClass = "w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-solid border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all shadow-sm";
export const labelClass = "block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5";
export const iconClass = "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500";

interface SectionHeaderProps {
    icon: React.ElementType;
    title: string;
    subtitle: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center border border-blue-100 dark:border-blue-500/30">
            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
            <h3 className="text-base font-bold text-gray-800 dark:text-slate-100">{title}</h3>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">{subtitle}</p>
        </div>
    </div>
);

interface FormattedInputProps {
    value: number | string;
    onChange: (val: number | string) => void;
    placeholder?: string;
    className?: string;
    isDecimal?: boolean;
    icon?: React.ElementType;
}

export const FormattedInput: React.FC<FormattedInputProps> = ({ value, onChange, placeholder, className, isDecimal = false, icon: Icon }) => {
    const [localVal, setLocalVal] = useState(() => {
        if (value == null || value === '' || value === 0) return '';
        return new Intl.NumberFormat('vi-VN', isDecimal ? { maximumFractionDigits: 2 } : {}).format(Number(value));
    });
    
    useEffect(() => {
        if (value == null || value === '' || value === 0) {
            setLocalVal('');
        } else {
            const currentParsed = isDecimal 
                ? parseFloat(localVal.replace(/\./g, '').replace(/,/g, '.'))
                : parseInt(localVal.replace(/\D/g, ''), 10);
                
            if (value !== currentParsed && !isNaN(Number(value))) {
                setLocalVal(new Intl.NumberFormat('vi-VN', isDecimal ? { maximumFractionDigits: 2 } : {}).format(Number(value)));
            }
        }
    }, [value, isDecimal]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^\d.,-]/g, '');
        if (!/^[0-9.,-]*$/.test(val)) return;
        
        if (val === '') {
            setLocalVal('');
            onChange('');
            return;
        }

        let parsed: number;
        let formattedStr = '';

        if (isDecimal) {
            let clean = val.replace(/[^\d,]/g, '');
            const parts = clean.split(',');
            if (parts.length > 2) {
                clean = parts[0] + ',' + parts.slice(1).join('');
            }
            if (parts[0]) {
                parts[0] = parseInt(parts[0], 10).toLocaleString('vi-VN');
            }
            formattedStr = parts.join(',');
            parsed = parseFloat(clean.replace(/,/g, '.'));
        } else {
            const clean = val.replace(/\D/g, '');
            if (!clean) {
                setLocalVal('');
                onChange('');
                return;
            }
            parsed = parseInt(clean, 10);
            formattedStr = parsed.toLocaleString('vi-VN');
        }
        
        setLocalVal(formattedStr);
        if (!isNaN(parsed)) onChange(parsed);
    };

    const handleBlur = () => {
        if (value != null && value !== '' && value !== 0) {
            setLocalVal(new Intl.NumberFormat('vi-VN', isDecimal ? { maximumFractionDigits: 2 } : {}).format(Number(value)));
        }
    };

    return (
        <div className={Icon ? "relative" : ""}>
            <input
                type="text"
                placeholder={placeholder}
                className={className}
                value={localVal}
                onChange={handleChange}
                onBlur={handleBlur}
            />
            {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-400" />}
        </div>
    );
};
