import React, { useEffect, useRef, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ProjectStatus, PROJECT_PHASE_COLORS } from '../../types';
import { formatCurrency } from '../../utils/format';
import { useTheme } from '../../context/ThemeContext';

interface Project {
    ProjectID?: string;
    ProjectName: string;
    Status: ProjectStatus;
    TotalInvestment: number;
    Coordinates?: { lat: number; lng: number };
    LocationCode?: string;
}

interface InteractiveMapProps {
    projects: Project[];
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
function getStatusInfo(status: ProjectStatus): { color: string; text: string } {
    const phase = PROJECT_PHASE_COLORS[status];
    if (phase) return { color: phase.hex, text: phase.label };
    return { color: '#6B7280', text: 'Không rõ' };
}

// Create custom Leaflet divIcon for a status color
function createMarkerIcon(color: string): L.DivIcon {
    return L.divIcon({
        className: 'custom-project-marker',
        html: `<div class="marker-pin pulse-animation" style="background-color: ${color};"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -10],
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
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(0,0,0,0.4); }
            70% { box-shadow: 0 0 0 10px rgba(0,0,0,0); }
            100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
        }
        .pulse-animation { animation: pulse 2s infinite; }
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
            font-size: 12px; font-weight: 900; color: #1f2937; margin: 0 0 4px 0;
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
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
    `;
    document.head.appendChild(style);
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ projects }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const [enrichedProjects, setEnrichedProjects] = useState<Project[]>([]);
    const { theme } = useTheme();
    const tileLayerRef = useRef<L.TileLayer | null>(null);

    // Inject marker CSS on mount
    useEffect(() => {
        injectMarkerStyles();
    }, []);

    // Initialize Leaflet map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
        }).setView([16.0, 106.0], 6);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Sync map tile layer with theme
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

        enrichedProjects.forEach((p) => {
            if (!p.Coordinates) return;

            const { color: statusColor, text: statusText } = getStatusInfo(p.Status);
            const icon = createMarkerIcon(statusColor);

            const marker = L.marker([p.Coordinates.lat, p.Coordinates.lng], { icon }).addTo(map);

            const popupContent = `
                <div style="padding: 8px; min-width: 200px; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                    <h4 class="popup-title">${p.ProjectName}</h4>
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                        <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; color: white; background-color: ${statusColor}; text-transform: uppercase;">
                            ${statusText}
                        </span>
                        <p class="popup-value">${formatCurrency(p.TotalInvestment)}</p>
                    </div>
                </div>
            `;

            marker.bindPopup(popupContent, { className: 'custom-popup' });
            markersRef.current.push(marker);
            bounds.extend(marker.getLatLng());
        });

        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
    }, [enrichedProjects]);

    return (
        <div
            ref={mapContainerRef}
            className="w-full h-full rounded-2xl custom-map-container"
            style={{ width: '100%', height: '100%', minHeight: '500px' }}
        />
    );
};

export default InteractiveMap;
