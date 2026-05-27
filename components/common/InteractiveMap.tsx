import React, { useEffect, useRef, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ProjectStatus, PROJECT_PHASE_COLORS, PROJECT_CURRENT_STATUS_CONFIG } from '../../types';
import { formatCurrency } from '../../utils/format';
import { useTheme } from '../../context/ThemeContext';

interface Project {
    ProjectID?: string;
    ProjectName: string;
    Status: ProjectStatus;
    CurrentStatus?: number;
    TotalInvestment: number;
    Coordinates?: { lat: number; lng: number };
    LocationCode?: string;
    InvestorName?: string;
    MainContractorName?: string;
    Progress?: number;
    ExpectedEndDate?: string;
}

export interface MaterialMine {
    id: string;
    name: string;
    mine_type: string;
    status: string;
    capacity: string;
    address: string;
    coordinates: { lat: number; lng: number };
    notes?: string;
}

interface InteractiveMapProps {
    projects: Project[];
    materialMines?: MaterialMine[];
    showMines?: boolean;
    showProjects?: boolean;
}

// Vietnamese province center coordinates fallback
const PROVINCE_COORDS: Record<string, { lat: number; lng: number }> = {
    'hà nội': { lat: 21.0285, lng: 105.8542 },
    'hồ chí minh': { lat: 10.8231, lng: 106.6297 },
    'hà tĩnh': { lat: 18.3559, lng: 105.8877 },
    'đà nẵng': { lat: 16.0544, lng: 108.2022 },
    'hải phòng': { lat: 20.8449, lng: 106.6881 },
    'cần thơ': { lat: 10.0452, lng: 105.7469 },
    'nghệ an': { lat: 18.6739, lng: 105.6813 },
    'thanh hóa': { lat: 19.8067, lng: 105.7852 },
    'bắc ninh': { lat: 21.1781, lng: 106.0710 },
    'hải dương': { lat: 20.9373, lng: 106.3145 },
    'vĩnh phúc': { lat: 21.3089, lng: 105.6050 },
    'bắc giang': { lat: 21.2730, lng: 106.1946 },
    'quảng ninh': { lat: 21.0064, lng: 107.2925 },
    'thái nguyên': { lat: 21.5928, lng: 105.8442 },
    'nam định': { lat: 20.4389, lng: 106.1621 },
    'thái bình': { lat: 20.4463, lng: 106.3365 },
    'hưng yên': { lat: 20.6464, lng: 106.0511 },
    'phú thọ': { lat: 21.3229, lng: 105.4019 },
    'hà nam': { lat: 20.5835, lng: 105.9229 },
    'ninh bình': { lat: 20.2506, lng: 105.9744 },
    'quảng bình': { lat: 17.4690, lng: 106.6222 },
    'quảng trị': { lat: 16.7500, lng: 107.1854 },
    'thừa thiên huế': { lat: 16.4637, lng: 107.5909 },
    'quảng nam': { lat: 15.5394, lng: 108.0191 },
    'quảng ngãi': { lat: 15.1214, lng: 108.8044 },
    'bình định': { lat: 13.7820, lng: 109.2197 },
    'khánh hòa': { lat: 12.2585, lng: 109.0526 },
    'gia lai': { lat: 13.9833, lng: 108.0000 },
    'đắk lắk': { lat: 12.7100, lng: 108.2378 },
    'lâm đồng': { lat: 11.9465, lng: 108.4419 },
    'bình thuận': { lat: 10.9282, lng: 108.1002 },
    'bình dương': { lat: 11.1664, lng: 106.6522 },
    'đồng nai': { lat: 10.9453, lng: 106.8244 },
    'bà rịa - vũng tàu': { lat: 10.5418, lng: 107.2430 },
    'long an': { lat: 10.5360, lng: 106.4134 },
    'tiền giang': { lat: 10.4493, lng: 106.3420 },
    'bến tre': { lat: 10.2434, lng: 106.3756 },
    'vĩnh long': { lat: 10.2537, lng: 105.9722 },
    'đồng tháp': { lat: 10.4937, lng: 105.6882 },
    'an giang': { lat: 10.3899, lng: 105.4356 },
    'kiên giang': { lat: 10.0125, lng: 105.0809 },
    'sóc trăng': { lat: 9.6036, lng: 105.9740 },
    'bạc liêu': { lat: 9.2940, lng: 105.7216 },
    'cà mau': { lat: 9.1769, lng: 105.1524 },
    'sơn la': { lat: 21.3269, lng: 103.9188 },
    'điện biên': { lat: 21.3860, lng: 103.0230 },
    'yên bái': { lat: 21.7168, lng: 104.9113 },
    'hòa bình': { lat: 20.8171, lng: 105.3384 },
    'hà giang': { lat: 22.8233, lng: 104.9838 },
    'cao bằng': { lat: 22.6666, lng: 106.2576 },
    'lạng sơn': { lat: 21.8539, lng: 106.7615 },
    'đắk nông': { lat: 12.0000, lng: 107.6833 },
    'kon tum': { lat: 14.3498, lng: 108.0005 },
    'ninh thuận': { lat: 11.5752, lng: 108.9890 },
    // Common district names in HCM 
    'hóc môn': { lat: 10.8861, lng: 106.5939 },
    'gò vấp': { lat: 10.8386, lng: 106.6503 },
    'bình tân': { lat: 10.7654, lng: 106.6037 },
    'thủ đức': { lat: 10.8562, lng: 106.7535 },
    'nhà bè': { lat: 10.6917, lng: 106.7000 },
    'củ chi': { lat: 11.0167, lng: 106.5833 },
    'bình chánh': { lat: 10.6833, lng: 106.5833 },
    'quận 7': { lat: 10.7340, lng: 106.7218 },
    'quận 12': { lat: 10.8671, lng: 106.6413 },
    'tân phú': { lat: 10.7918, lng: 106.6283 },
    'tân bình': { lat: 10.8015, lng: 106.6528 },
    'phú nhuận': { lat: 10.7991, lng: 106.6816 },
    'sài gòn': { lat: 10.7769, lng: 106.7009 },
    'an đông': { lat: 10.7670, lng: 106.6900 },
    'diên hồng': { lat: 10.7760, lng: 106.7040 },
    'chánh hưng': { lat: 10.7333, lng: 106.6573 },
    'tân nhựt': { lat: 10.6100, lng: 106.5400 },
    // Common district names in Hanoi 
    'cổ nhuế': { lat: 21.0575, lng: 105.7863 },
    'đông ngạc': { lat: 21.0700, lng: 105.7850 },
    'bắc từ liêm': { lat: 21.0667, lng: 105.7667 },
    'nam từ liêm': { lat: 21.0167, lng: 105.7667 },
    'cầu giấy': { lat: 21.0333, lng: 105.7833 },
    'thanh xuân': { lat: 20.9917, lng: 105.8083 },
    'hoàng mai': { lat: 20.9750, lng: 105.8500 },
    'long biên': { lat: 21.0500, lng: 105.8833 },
    'hà đông': { lat: 20.9667, lng: 105.7667 },
};

// Try to extract province/district from LocationCode text 
function extractCoords(locationCode: string): { lat: number; lng: number } | null {
    const lower = locationCode.toLowerCase();
    let bestMatch: { key: string; coords: { lat: number; lng: number } } | null = null;
    for (const [name, coords] of Object.entries(PROVINCE_COORDS)) {
        if (lower.includes(name)) {
            if (!bestMatch || name.length > bestMatch.key.length) {
                bestMatch = { key: name, coords };
            }
        }
    }
    if (bestMatch) {
        return {
            lat: bestMatch.coords.lat + (Math.random() - 0.5) * 0.01,
            lng: bestMatch.coords.lng + (Math.random() - 0.5) * 0.01,
        };
    }
    return null;
}

// Geocode cache
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

async function geocodeLocation(locationCode: string): Promise<{ lat: number; lng: number } | null> {
    if (!locationCode || locationCode.trim() === '' || locationCode.includes('Chưa cập nhật') || locationCode.includes('Đang cập nhật')) {
        return null;
    }

    if (geocodeCache.has(locationCode)) {
        return geocodeCache.get(locationCode) || null;
    }

    const localCoords = extractCoords(locationCode);
    if (localCoords) {
        geocodeCache.set(locationCode, localCoords);
        return localCoords;
    }

    // Fallback: Nominatim API  
    try {
        const query = encodeURIComponent(locationCode + ', Việt Nam');
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=vn`, {
            headers: { 'Accept-Language': 'vi' }
        });
        const data = await res.json();
        if (data && data.length > 0) {
            const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            geocodeCache.set(locationCode, result);
            return result;
        }
    } catch {
        // Geocoding failed silently
    }

    geocodeCache.set(locationCode, null);
    return null;
}

// Get status info from project status
function getStatusInfo(status: ProjectStatus, currentStatus?: number): { color: string; text: string } {
    if (currentStatus && PROJECT_CURRENT_STATUS_CONFIG[currentStatus]) {
        const config = PROJECT_CURRENT_STATUS_CONFIG[currentStatus];
        return { color: config.hex, text: config.label };
    }
    const phase = PROJECT_PHASE_COLORS[status];
    if (phase) return { color: phase.hex, text: phase.label };
    return { color: '#6B7280', text: 'Không rõ' };
}

// Create custom Leaflet divIcon for a status color
function createMarkerIcon(color: string): L.DivIcon {
    return L.divIcon({
        className: 'custom-project-marker',
        html: `<div class="marker-pin" style="background-color: ${color};"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -10],
    });
}

function createMineIcon(type: string): L.DivIcon {
    const color = type === 'Đất' ? '#A0522D' : type === 'Cát' ? '#F4A460' : '#708090'; // Sienne, SandyBrown, SlateGray
    return L.divIcon({
        className: 'custom-mine-marker',
        html: `<div class="mine-marker-pin" style="background-color: ${color}; display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 4px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.4 3.4a2.83 2.83 0 0 0-4 4L11 19"/><path d="m9 11 4 4"/><path d="m13 15 6 6"/><path d="m21 21-2-2"/></svg>
        </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -12],
    });
}

// Inject global CSS for markers (only once)
let styleInjected = false;
function injectMarkerStyles() {
    if (styleInjected) return;
    styleInjected = true;
    const style = document.createElement('style');
    style.textContent = `
        .custom-project-marker { background: transparent; }
        .marker-pin {
            width: 14px; height: 14px; border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.4);
        }
        .custom-popup .leaflet-popup-content-wrapper {
            border-radius: 12px; padding: 0; overflow: hidden;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
            background: white !important;
            color: #1f2937 !important;
        }
        .dark .custom-popup .leaflet-popup-content-wrapper {
            background: #1e293b !important;
            color: #f1f5f9 !important;
            border: 1px solid #334155;
        }
        .custom-popup .leaflet-popup-content { margin: 0; width: auto !important; }
        .custom-popup .leaflet-popup-tip { background: white !important; }
        .dark .custom-popup .leaflet-popup-tip { background: #1e293b !important; }
        .popup-title {
            font-size: 13px; font-weight: 900; color: #1f2937; margin: 0 0 6px 0;
            line-height: 1.4;
        }
        .dark .popup-title {
            color: #f1f5f9 !important;
        }
        .popup-value {
            font-size: 10px; font-weight: 700; color: #6b7280; margin: 0;
        }
        .dark .popup-value {
            color: #94a3b8 !important;
        }
        .popup-detail-row {
            display: flex; justify-content: space-between; font-size: 11px;
        }
        .popup-detail-label {
            color: #64748b;
        }
        .dark .popup-detail-label {
            color: #94a3b8;
        }
        .popup-detail-value {
            font-weight: 600; color: #334155; text-align: right;
        }
        .dark .popup-detail-value {
            color: #f1f5f9;
        }
    `;
    document.head.appendChild(style);
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ projects, materialMines = [], showMines = false, showProjects = true }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const [enrichedProjects, setEnrichedProjects] = useState<Project[]>([]);
    const [hiddenProjectIds, setHiddenProjectIds] = useState<Set<string>>(() => {
        try {
            const stored = localStorage.getItem('hiddenProjectIds');
            if (stored) {
                const parsed = JSON.parse(stored);
                return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
            }
        } catch { }
        return new Set<string>();
    });
    const { theme } = useTheme();
    const tileLayerRef = useRef<L.TileLayer | null>(null);

    // Inject marker CSS on mount
    useEffect(() => {
        injectMarkerStyles();
    }, []);

    useEffect(() => {
        localStorage.setItem('hiddenProjectIds', JSON.stringify(Array.from(hiddenProjectIds)));
    }, [hiddenProjectIds]);

    useEffect(() => {
        const handleStorageChange = () => {
            try {
                const stored = localStorage.getItem('hiddenProjectIds');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setHiddenProjectIds(new Set(Array.isArray(parsed) ? parsed.map(String) : []));
                } else {
                    setHiddenProjectIds(new Set());
                }
            } catch { }
        };
        window.addEventListener('hiddenProjectIdsChanged', handleStorageChange);
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('hiddenProjectIdsChanged', handleStorageChange);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Initialize Leaflet map and popup click listener
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
        }).setView([16.0, 106.0], 6);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapRef.current = map;

        const handlePopupClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const btn = target.closest('.hide-project-btn') as HTMLElement;
            if (btn) {
                const projectId = btn.getAttribute('data-project-id');
                if (projectId) {
                    setHiddenProjectIds(prev => {
                        const next = new Set(prev);
                        next.add(String(projectId));
                        return next;
                    });
                    map.closePopup();
                }
            }
        };
        mapContainerRef.current.addEventListener('click', handlePopupClick);

        return () => {
            if (mapContainerRef.current) {
                mapContainerRef.current.removeEventListener('click', handlePopupClick);
            }
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Sync map tile layer with theme (always use bright voyager tiles)
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (tileLayerRef.current) {
            map.removeLayer(tileLayerRef.current);
        }

        const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        const tileAttribution = '&copy; OpenStreetMap contributors &copy; CARTO';

        const newTileLayer = L.tileLayer(tileUrl, {
            attribution: tileAttribution,
            crossOrigin: true, // Enable CORS requests to resolve COEP (Cross-Origin Embedder Policy) block
        }).addTo(map);

        tileLayerRef.current = newTileLayer;
    }, [theme]);

    // Geocode and enrich projects
    useEffect(() => {
        let cancelled = false;

        const enrichAll = async () => {
            const enriched = await Promise.all(
                projects.map(async (p) => {
                    if (p.Coordinates) return p;
                    if (!p.LocationCode) return p;
                    const coords = await geocodeLocation(p.LocationCode);
                    return coords ? { ...p, Coordinates: coords } : p;
                })
            );

            if (!cancelled) {
                setEnrichedProjects(enriched);
            }
        };

        enrichAll();
        return () => { cancelled = true; };
    }, [projects]);

    // Update markers on map when enrichedProjects change
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        // Clear existing markers
        markersRef.current.forEach(m => map.removeLayer(m));
        markersRef.current = [];

        const bounds = L.latLngBounds([]);

        if (showProjects) {
            enrichedProjects.forEach((p) => {
                if (!p.Coordinates) return;
                if (p.ProjectID && hiddenProjectIds.has(String(p.ProjectID))) return;

                const { color: statusColor, text: statusText } = getStatusInfo(p.Status, p.CurrentStatus);
                const icon = createMarkerIcon(statusColor);

                const marker = L.marker([p.Coordinates.lat, p.Coordinates.lng], { icon }).addTo(map);

                const progressColor = (p.Progress || 0) >= 80 ? '#10B981' : (p.Progress || 0) >= 50 ? '#F59E0B' : '#EF4444';
                const popupContent = `
                    <div style="padding: 10px; min-width: 260px; max-width: 320px; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                            <h4 class="popup-title" style="flex: 1; margin-bottom: 0;">${p.ProjectName}</h4>
                            <button class="hide-project-btn" data-project-id="${p.ProjectID}" style="padding: 3px 6px; background: transparent; color: #ef4444; border: 1px solid #fecaca; border-radius: 4px; font-size: 9px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='transparent'" title="Ẩn dự án này khỏi bản đồ">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
                                Ẩn
                            </button>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px; margin-bottom: 12px;">
                            <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; color: white; background-color: ${statusColor}; text-transform: uppercase;">
                                ${statusText}
                            </span>
                            <p class="popup-value" style="color: #4f46e5; font-size: 11px;">${formatCurrency(p.TotalInvestment)}</p>
                        </div>
                        
                        <div style="display: flex; flex-direction: column; gap: 6px; border-top: 1px dashed #e2e8f0; padding-top: 10px; margin-top: 6px;">
                            <div class="popup-detail-row">
                                <span class="popup-detail-label">Nhà thầu chính:</span>
                                <span class="popup-detail-value" style="max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${p.MainContractorName || 'Chưa cập nhật'}">${p.MainContractorName || 'Chưa cập nhật'}</span>
                            </div>
                            <div class="popup-detail-row">
                                <span class="popup-detail-label">Địa điểm:</span>
                                <span class="popup-detail-value" style="max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${p.LocationCode || 'Chưa cập nhật'}">${p.LocationCode || 'Chưa cập nhật'}</span>
                            </div>
                            <div class="popup-detail-row">
                                <span class="popup-detail-label">Dự kiến H.Thành:</span>
                                <span class="popup-detail-value">${p.ExpectedEndDate ? new Date(p.ExpectedEndDate).toLocaleDateString('vi-VN') : '---'}</span>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
                                <div class="popup-detail-row">
                                    <span class="popup-detail-label">Tiến độ thi công:</span>
                                    <span style="font-weight: 700; color: ${progressColor};">${p.Progress || 0}%</span>
                                </div>
                                <div style="width: 100%; height: 4px; background-color: #f1f5f9; border-radius: 2px; overflow: hidden;">
                                    <div style="height: 100%; width: ${p.Progress || 0}%; background-color: ${progressColor};"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                marker.bindPopup(popupContent, { className: 'custom-popup' });
                markersRef.current.push(marker);
                bounds.extend(marker.getLatLng());
            });
        }

        // Draw Material Mines if toggled
        if (showMines && materialMines && materialMines.length > 0) {
            materialMines.forEach((m) => {
                if (!m.coordinates || !m.coordinates.lat) return;

                const icon = createMineIcon(m.mine_type);
                const marker = L.marker([m.coordinates.lat, m.coordinates.lng], { icon }).addTo(map);
                
                const typeColor = m.mine_type === 'Đất' ? '#A0522D' : m.mine_type === 'Cát' ? '#F4A460' : '#708090';

                const popupContent = `
                    <div style="padding: 10px; min-width: 240px; max-width: 300px; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                            <span style="padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; color: white; background-color: ${typeColor}; text-transform: uppercase; letter-spacing: 0.5px;">
                                Mỏ ${m.mine_type}
                            </span>
                            <span style="font-size: 10px; font-weight: 600; color: ${m.status === 'Đang khai thác' ? '#10B981' : '#F59E0B'}; border: 1px solid currentColor; padding: 1px 4px; border-radius: 4px;">
                                ${m.status}
                            </span>
                        </div>
                        <h4 class="popup-title" style="margin-bottom: 10px;">${m.name}</h4>
                        
                        <div style="display: flex; flex-direction: column; gap: 6px; border-top: 1px dashed #e2e8f0; padding-top: 8px;">
                            <div class="popup-detail-row">
                                <span class="popup-detail-label">Trữ lượng:</span>
                                <span class="popup-detail-value" style="color: #4f46e5;">${m.capacity || 'Không rõ'}</span>
                            </div>
                            <div class="popup-detail-row">
                                <span class="popup-detail-label">Vị trí:</span>
                                <span class="popup-detail-value" style="max-width: 150px;" title="${m.address || ''}">${m.address || 'Không rõ'}</span>
                            </div>
                            ${m.notes ? `
                            <div class="popup-detail-row" style="margin-top: 4px; border-top: 1px dotted #e2e8f0; padding-top: 4px;">
                                <span class="popup-detail-value" style="color: #64748b; font-size: 10px; text-align: left; font-weight: 400;">${m.notes}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `;

                marker.bindPopup(popupContent, { className: 'custom-popup' });
                markersRef.current.push(marker);
                bounds.extend(marker.getLatLng());
            });
        }

        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
    }, [enrichedProjects, materialMines, showMines, showProjects, hiddenProjectIds]);

    return (
        <div className="relative w-full h-full">
            <div
                ref={mapContainerRef}
                className="w-full h-full rounded-2xl custom-map-container"
                style={{ width: '100%', height: '100%', minHeight: '500px' }}
            />
            
            {/* Show reset hidden projects button if any project is hidden */}
            {hiddenProjectIds.size > 0 && (
                <div className="absolute bottom-6 left-6 z-[1000]">
                    <button
                        onClick={() => setHiddenProjectIds(new Set())}
                        className="bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 px-3 py-2 rounded-xl shadow-md text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                        Khôi phục {hiddenProjectIds.size} dự án đã ẩn
                    </button>
                </div>
            )}
        </div>
    );
};

export default InteractiveMap;
